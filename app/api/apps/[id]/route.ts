import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateApp } from "@/lib/mutations";
import { createAdminClient, LOGO_BUCKET } from "@/lib/supabase/admin";
import { editAppSchema } from "@/lib/validations";

const MAX_LOGO_BYTES = 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "No autenticado." }, { status: 401 });
  }

  const { id: appId } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Formato inválido." }, { status: 400 });
  }

  const parsed = editAppSchema.safeParse({
    name: form.get("name"),
    categoryId: form.get("categoryId"),
    websiteUrl: form.get("websiteUrl"),
    description: form.get("description"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  let logoUrl: string | undefined;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
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
    const path = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType: logo.type, upsert: false });
    if (upErr) {
      return NextResponse.json(
        { ok: false, message: "No pudimos subir el logo. Probá de nuevo." },
        { status: 500 },
      );
    }
    logoUrl = admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  try {
    await updateApp(appId, user.id, {
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      websiteUrl: parsed.data.websiteUrl,
      description: parsed.data.description,
      logoUrl,
    });
  } catch (err) {
    console.error("[api/apps/[id]] update failed:", err);
    return NextResponse.json(
      { ok: false, message: "No pudimos guardar los cambios. Probá de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
