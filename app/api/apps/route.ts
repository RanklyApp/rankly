import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createApp } from "@/lib/mutations";
import { createAdminClient, LOGO_BUCKET } from "@/lib/supabase/admin";
import { submitAppSchema } from "@/lib/validations";

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

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

  // Validate text fields with Zod.
  const parsed = submitAppSchema.safeParse({
    name: form.get("name"),
    tagline: form.get("tagline"),
    description: form.get("description"),
    websiteUrl: form.get("websiteUrl"),
    categoryId: form.get("categoryId"),
    ownerEmail: form.get("ownerEmail"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Validate logo file.
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

  // Upload logo to Supabase Storage.
  let logoUrl: string;
  try {
    const supabase = createAdminClient();
    const path = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType: logo.type, upsert: false });
    if (error) throw error;
    logoUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data
      .publicUrl;
  } catch (err) {
    console.error("[api/apps] logo upload failed:", err);
    return NextResponse.json(
      {
        ok: false,
        message:
          "No pudimos guardar el logo. Verificá la configuración de almacenamiento.",
      },
      { status: 503 },
    );
  }

  // Insert the app (status: pending -> moderation queue).
  try {
    const app = await createApp({ ...parsed.data, logoUrl });
    return NextResponse.json({ ok: true, slug: app.slug }, { status: 201 });
  } catch (err) {
    console.error("[api/apps] insert failed:", err);
    return NextResponse.json(
      { ok: false, message: "No pudimos guardar la app. Probá de nuevo." },
      { status: 500 },
    );
  }
}
