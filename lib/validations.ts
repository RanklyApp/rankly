import { z } from "zod";

/**
 * Public business submission. Validated on the API route (server) and reused on
 * the client form. The logo is uploaded separately (multipart) and its
 * resulting URL is not part of this schema.
 *
 * Fields: contact email, public name (shown in the ranking), category (from the
 * fixed `categories` table), website, and an OPTIONAL detailed description used
 * to improve search. There is no separate "tagline" — the one-liner shown in
 * listings is derived from the description (or the name) in `createApp`.
 */
export const submitAppSchema = z.object({
  ownerEmail: z.string().trim().email("Email inválido").max(200),
  // Account password (email + password auth). Created together with the
  // business in a single step. Supabase caps passwords at 72 bytes.
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(60, "Máximo 60 caracteres"),
  categoryId: z.string().uuid("Elegí una categoría"),
  websiteUrl: z
    .string()
    .trim()
    .url("Poné una URL válida (https://...)")
    .max(300),
  // Optional. Empty string from the form is normalized to undefined so it
  // passes without tripping a min-length check.
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(600, "Máximo 600 caracteres").optional(),
  ),
});

export type SubmitAppInput = z.infer<typeof submitAppSchema>;

/** Owner login (email + password). */
export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(200),
  password: z.string().min(1, "Ingresá tu contraseña").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Admin moderation action. */
export const moderateAppSchema = z.object({
  appId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

export type ModerateAppInput = z.infer<typeof moderateAppSchema>;

/** Category create/edit (admin). */
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (usá minúsculas y guiones)"),
  description: z.string().trim().min(4).max(300),
  icon: z.string().trim().min(1).max(40),
  seoTitle: z.string().trim().min(4).max(70),
  seoDescription: z.string().trim().min(10).max(160),
});

export type CategoryInput = z.infer<typeof categorySchema>;

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
