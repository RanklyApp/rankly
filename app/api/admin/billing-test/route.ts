import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDbConfigured, schema } from "@/db";
import type { App } from "@/db/schema";
import {
  createMandateCheckout,
  getDodo,
  isDodoConfigured,
} from "@/lib/billing/dodo";
import { captureMandate, runDailyChargeForApp } from "@/lib/billing/service";

// Node runtime: the Dodo SDK needs Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * TEMPORARY manual billing-test harness (Fase 0).
 *
 * Lets the operator drive the ALREADY-BUILT billing engine by hand, one step at a
 * time, before the daily cron is turned on — so the first real (live-mode) charge
 * is a controlled $1, not an automatic surprise. Every action is gated by
 * `?secret=$CRON_SECRET`. `charge` also requires `&confirm=yes` because it moves
 * REAL money in live mode.
 *
 * DELETE this route once Fase 1 (the real "add card" UI) lands — it is a scaffold,
 * not a permanent admin surface. After using it, rotate CRON_SECRET (it travels in
 * the mandate return_url query string).
 *
 * Actions (all GET, open in a browser):
 *   ?action=apps                      list businesses + whether each has a saved card
 *   ?action=status&appId=…            dump this app's billing state (billing_days + charges)
 *   ?action=mandate&appId=…           redirect to Dodo to SAVE a card ($0, mandate only)
 *   ?action=capture&appId=…           (return_url target) store the saved-card subscription
 *   ?action=charge&appId=…&confirm=yes[&amount=1]   fire ONE off-session charge (real $)
 *   ?action=reset&appId=…             set desired bid back to $0 (stop future daily charges)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado en el entorno." },
      { status: 500 },
    );
  }
  if (url.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "La base de datos no está configurada." },
      { status: 500 },
    );
  }

  const db = getDb();
  const { apps, billingDays, charges } = schema;
  const action = url.searchParams.get("action") ?? "apps";

  const loadApp = async (id: string): Promise<App | undefined> => {
    const rows = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
    return rows[0];
  };
  const requireApp = async (): Promise<App | NextResponse> => {
    const appId = url.searchParams.get("appId");
    if (!appId) {
      return NextResponse.json(
        { error: "Falta ?appId=… . Usá ?action=apps para ver los IDs." },
        { status: 400 },
      );
    }
    const app = await loadApp(appId);
    if (!app) {
      return NextResponse.json(
        { error: `No existe ningún negocio con id ${appId}.` },
        { status: 404 },
      );
    }
    return app;
  };

  try {
    switch (action) {
      // ---- list businesses -------------------------------------------------
      case "apps": {
        const rows = await db.select().from(apps);
        return NextResponse.json({
          count: rows.length,
          apps: rows.map((a) => ({
            id: a.id,
            name: a.name,
            ownerEmail: a.ownerEmail,
            status: a.status,
            plan: a.plan,
            dailyAmountCents: a.dailyAmountCents,
            desiredDailyAmountCents: a.desiredDailyAmountCents,
            hasSavedCard: Boolean(a.dodoSubscriptionId),
          })),
        });
      }

      // ---- inspect one app's billing state ---------------------------------
      case "status": {
        const app = await requireApp();
        if (app instanceof NextResponse) return app;
        const days = await db
          .select()
          .from(billingDays)
          .where(eq(billingDays.appId, app.id))
          .orderBy(desc(billingDays.day))
          .limit(5);
        const chg = await db
          .select()
          .from(charges)
          .where(eq(charges.appId, app.id))
          .orderBy(desc(charges.createdAt))
          .limit(10);
        return NextResponse.json({
          app: {
            id: app.id,
            name: app.name,
            status: app.status,
            plan: app.plan,
            dailyAmountCents: app.dailyAmountCents,
            desiredDailyAmountCents: app.desiredDailyAmountCents,
            hasSavedCard: Boolean(app.dodoSubscriptionId),
            dodoSubscriptionId: app.dodoSubscriptionId,
            dodoCustomerId: app.dodoCustomerId,
            billingAlertAt: app.billingAlertAt,
          },
          billingDays: days,
          charges: chg,
        });
      }

      // ---- save a card (mandate, $0) → redirect to Dodo --------------------
      case "mandate": {
        const app = await requireApp();
        if (app instanceof NextResponse) return app;
        if (!isDodoConfigured()) {
          return NextResponse.json(
            { error: "Faltan las variables de Dodo en el entorno." },
            { status: 500 },
          );
        }
        // return_url is built from THIS request's origin so it always points at
        // the deployment we're on, and carries the secret so capture is gated.
        const returnUrl = `${url.origin}/api/admin/billing-test?action=capture&appId=${app.id}&secret=${encodeURIComponent(secret)}`;
        const { checkoutUrl } = await createMandateCheckout({
          customerId: app.dodoCustomerId ?? undefined,
          customerEmail: app.ownerEmail,
          returnUrl,
          metadata: { app_id: app.id },
        });
        return NextResponse.redirect(checkoutUrl, 307);
      }

      // ---- capture the saved-card subscription after checkout --------------
      case "capture": {
        const app = await requireApp();
        if (app instanceof NextResponse) return app;

        let customerId = app.dodoCustomerId ?? undefined;
        if (!customerId) {
          const page = await getDodo().customers.list({ email: app.ownerEmail });
          const items =
            (page as unknown as { items?: Array<{ customer_id?: string }> })
              .items ??
            (page as unknown as { data?: Array<{ customer_id?: string }> })
              .data ??
            [];
          customerId = items[0]?.customer_id;
        }
        if (!customerId) {
          return NextResponse.json({
            ok: false,
            step: "capture",
            error: `No encontré un cliente de Dodo para ${app.ownerEmail}. ¿Completaste el checkout con ese email?`,
          });
        }
        const res = await captureMandate(app.id, customerId);
        return NextResponse.json({
          ok: res.ok,
          step: "capture",
          customerId,
          subscriptionId: res.subscriptionId ?? null,
          message: res.ok
            ? "Tarjeta guardada. Ya podés hacer el cobro de prueba: action=charge&confirm=yes&amount=1"
            : "No se pudo capturar el mandato. Revisá que el checkout haya quedado 'active'.",
        });
      }

      // ---- fire ONE real off-session charge --------------------------------
      case "charge": {
        const app = await requireApp();
        if (app instanceof NextResponse) return app;
        if (url.searchParams.get("confirm") !== "yes") {
          return NextResponse.json(
            {
              error:
                "Este endpoint COBRA PLATA REAL en live_mode. Agregá &confirm=yes para confirmar.",
            },
            { status: 400 },
          );
        }
        const amountDollars = Math.trunc(
          Number(url.searchParams.get("amount") ?? "1"),
        );
        if (!Number.isFinite(amountDollars) || amountDollars < 1) {
          return NextResponse.json(
            { error: "amount inválido — tiene que ser un entero >= 1." },
            { status: 400 },
          );
        }
        // Set the desired bid, then run the EXACT per-app path the daily cron
        // uses. Reflects in billing_days + charges; the webhook confirms it.
        await db
          .update(apps)
          .set({ desiredDailyAmountCents: amountDollars * 100 })
          .where(eq(apps.id, app.id));
        const fresh = await loadApp(app.id);
        const result = await runDailyChargeForApp(fresh!);
        return NextResponse.json({
          step: "charge",
          requestedDollars: amountDollars,
          result,
          message:
            result.ok === true
              ? "Cobro disparado. El monto/ranking solo suben cuando llega el webhook payment.succeeded. Verificá con action=status."
              : `No se cobró (reason: ${result.reason}). Verificá con action=status.`,
        });
      }

      // ---- reset desired to $0 (cleanup) -----------------------------------
      case "reset": {
        const app = await requireApp();
        if (app instanceof NextResponse) return app;
        await db
          .update(apps)
          .set({ desiredDailyAmountCents: 0 })
          .where(eq(apps.id, app.id));
        return NextResponse.json({
          ok: true,
          message:
            "desired = $0. El cron automático ya no intentará cobrar este negocio.",
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Acción desconocida: ${action}`,
            actions: ["apps", "status", "mandate", "capture", "charge", "reset"],
          },
          { status: 400 },
        );
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Falló la acción.", action, detail },
      { status: 500 },
    );
  }
}
