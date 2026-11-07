"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { updateLiteApp } from "@/lib/mutations";
import { createAdminClient, LOGO_BUCKET } from "@/lib/supabase/admin";
import { liteEditAppSchema } from "@/lib/validations";

const MAX_LOGO_BYTES = 1024 * 1024;
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export interface LiteFormState {
  ok?: boolean;
  errors?: Partial<Record<string, string[]>>;
  message?: string;
}

export async function saveLiteAppAction(
  _prev: LiteFormState,
  formData: FormData,
): Promise<LiteFormState> {
  const user = await getSessionUser();
  if (!user) return { message: "Se cerró la sesión. Volvé a entrar." };

  const appId = formData.get("appId");
  if (typeof appId !== "string" || !z.string().uuid().safeParse(appId).success) {
    return { message: "Negocio inválido." };
  }

  const parsed = liteEditAppSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    websiteUrl: formData.get("websiteUrl"),
    description: formData.get("description"),
    tagline: formData.get("tagline"),
    ownerEmail: formData.get("ownerEmail"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Ownership check + fetch slug/categorySlug for cache invalidation.
  const { apps, categories } = schema;
  const appRow = await getDb()
    .select({ slug: apps.slug, categorySlug: categories.slug })
    .from(apps)
    .innerJoin(categories, eq(apps.categoryId, categories.id))
    .where(and(eq(apps.id, appId), eq(apps.ownerUserId, user.id)))
    .limit(1);
  if (!appRow[0]) return { message: "No encontramos ese negocio." };

  // Logo upload
  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const ext = ALLOWED_LOGO_TYPES[logo.type];
    if (!ext) {
      return { errors: { logo: ["Formato no permitido (PNG, JPG, WEBP o SVG)"] } };
    }
    if (logo.size > MAX_LOGO_BYTES) {
      return { errors: { logo: ["El logo supera 1 MB"] } };
    }
    const admin = createAdminClient();
    const path = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType: logo.type, upsert: false });
    if (upErr) {
      return { message: "No pudimos subir el logo. Probá de nuevo." };
    }
    logoUrl = admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  try {
    await updateLiteApp(appId, user.id, { ...parsed.data, logoUrl });
  } catch (err) {
    console.error("[dashboard] saveLiteApp failed:", err);
    return { message: "No pudimos guardar los cambios. Probá de nuevo." };
  }

  revalidatePath(`/app/${appRow[0].slug}`);
  revalidatePath(`/c/${appRow[0].categorySlug}`);
  revalidatePath("/");
  revalidatePath("/dashboard");

  return { ok: true };
}
