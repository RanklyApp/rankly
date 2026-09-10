"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  moderateApp,
  updateCategory,
} from "@/lib/mutations";
import { categorySchema, moderateAppSchema } from "@/lib/validations";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

/** Plain form action (progressive enhancement, no JS required). */
export async function moderateAction(formData: FormData): Promise<void> {
  const parsed = moderateAppSchema.safeParse({
    appId: formData.get("appId"),
    action: formData.get("action"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return;

  // NOTE: rejection reason is captured but not persisted in Phase 1 (no column
  // in the data model). Wire it to an email/notification in Phase 2.
  await moderateApp(parsed.data.appId, parsed.data.action);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Datos inválidos." };
  }

  try {
    await createCategory(parsed.data);
    revalidatePath("/admin/categories");
    revalidatePath("/categorias");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { error: "No se pudo crear la categoría (¿slug repetido?)." };
  }
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Falta el id." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Datos inválidos." };
  }

  try {
    await updateCategory(id, parsed.data);
    revalidatePath("/admin/categories");
    revalidatePath(`/c/${parsed.data.slug}`);
    revalidatePath("/categorias");
    return { ok: true };
  } catch {
    return { error: "No se pudo actualizar la categoría." };
  }
}
