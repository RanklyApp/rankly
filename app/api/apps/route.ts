import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureUserRow } from "@/lib/auth";
import { createApp } from "@/lib/mutations";
import { createAdminClient, LOGO_BUCKET } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitAppSchema } from "@/lib/validations";

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/**
 * Single-step signup: creates an account (email + password) AND the business,
 * linked to that account and published immediately (status 'approved' — no
 * moderation, no email verification). Then signs the user in and tells the
 * client to go to the dashboard. Honeypot is the only spam filter for now.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Formato de envío inválido." },
      { status: 400 },
    );
  }

  // Honeypot: hidden field only bots fill. Silently accept without doing work.
  const honeypot = form.get("company");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true, redirect: "/dashboard" }, { status: 201 });
  }

  // Validate text fields (email, password, business fields).
  const parsed = submitAppSchema.safeParse({
    ownerEmail: form.get("ownerEmail"),
    password: form.get("password"),
    name: form.get("name"),
    description: form.get("description"),
    websiteUrl: form.get("websiteUrl"),
    categoryId: form.get("categoryId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const email = parsed.data.ownerEmail.toLowerCase();

  // Validate the logo file (cheap checks) before creating anything.
  const logo = form.get("logo");
  if (!(logo instanceof File) || logo.size === 0) {
    return NextResponse.json(
      { ok: false, errors: { logo: ["Subí un logo"] } },
      { status: 422 },
    );
  }
  const ext = ALLOWED_TYPES[logo.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, errors: { logo: ["Formato no permitido (PNG, JPG, WEBP o SVG)"] } },
      { status: 422 },
    );
  }
  if (logo.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { ok: false, errors: { logo: ["El logo supera 1 MB"] } },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // 1) Resolve the account.
  //    - New email  → create it, already email-confirmed (no verification mail).
  //    - Existing email → verify the typed password by signing in, then reuse
  //      that account (so a returning owner can add a business without hitting
  //      an error). Only a wrong password is rejected.
  let userId: string;
  let isNewAccount: boolean;

  const { data: created } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (created?.user) {
    userId = created.user.id;
    isNewAccount = true;
  } else {
    // Email already registered (or createUser failed) → verify via sign-in.
    const supabase = await createSupabaseServerClient();
    const { data: signedIn, error: signInErr } =
      await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      });
    if (signInErr || !signedIn.user) {
      return NextResponse.json(
        {
          ok: false,
          errors: {
            password: [
              "Ese email ya tiene una cuenta y la contraseña no coincide. Si es tuya, entrá por /acceder.",
            ],
          },
        },
        { status: 409 },
      );
    }
    userId = signedIn.user.id;
    isNewAccount = false;
  }

  // 2) Ensure user row, upload logo, create the linked business. If any of this
  //    fails and we JUST created the account, roll it back (never touch a
  //    pre-existing account).
  try {
    await ensureUserRow(userId, email);

    const path = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType: logo.type, upsert: false });
    if (upErr) throw upErr;
    const logoUrl = admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data
      .publicUrl;

    await createApp({
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      websiteUrl: parsed.data.websiteUrl,
      description: parsed.data.description,
      ownerEmail: email,
      ownerUserId: userId,
      logoUrl,
    });
  } catch (err) {
    console.error("[api/apps] signup failed:", err);
    if (isNewAccount) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (rollbackErr) {
        console.error("[api/apps] rollback deleteUser failed:", rollbackErr);
      }
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos guardar tu negocio. Probá de nuevo." },
      { status: 500 },
    );
  }

  // 3) New accounts need their first sign-in to set the session cookies.
  //    Existing accounts were already signed in during password verification.
  if (isNewAccount) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      });
    } catch (err) {
      console.error("[api/apps] auto sign-in failed:", err);
      return NextResponse.json({ ok: true, redirect: "/acceder" }, { status: 201 });
    }
  }

  return NextResponse.json({ ok: true, redirect: "/dashboard" }, { status: 201 });
}
