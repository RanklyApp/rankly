import { z } from "zod";

/**
 * Public app submission. Validated on the API route (server) and reused on the
 * client form. The logo is uploaded separately (multipart) and its resulting
 * URL is not part of this schema.
 */
export const submitAppSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(60, "Máximo 60 caracteres"),
  tagline: z
    .string()
    .trim()
    .min(4, "La descripción de una línea es muy corta")
    .max(80, "Máximo 80 caracteres"),
  description: z
    .string()
    .trim()
    .min(20, "Contanos un poco más (mínimo 20 caracteres)")
    .max(600, "Máximo 600 caracteres"),
  websiteUrl: z
    .string()
    .trim()
    .url("Poné una URL válida (https://...)")
    .max(300),
  categoryId: z.string().uuid("Elegí una categoría"),
  ownerEmail: z.string().trim().email("Email inválido").max(200),
});

export type SubmitAppInput = z.infer<typeof submitAppSchema>;

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
