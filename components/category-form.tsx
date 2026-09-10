"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/db/schema";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface CategoryFormProps {
  action: Action;
  category?: Category;
  submitLabel: string;
}

export function CategoryForm({
  action,
  category,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${category?.id ?? "new"}`}>Nombre</Label>
          <Input
            id={`name-${category?.id ?? "new"}`}
            name="name"
            defaultValue={category?.name}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slug-${category?.id ?? "new"}`}>Slug</Label>
          <Input
            id={`slug-${category?.id ?? "new"}`}
            name="slug"
            defaultValue={category?.slug}
            placeholder="transcripcion"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`description-${category?.id ?? "new"}`}>
          Descripción
        </Label>
        <Input
          id={`description-${category?.id ?? "new"}`}
          name="description"
          defaultValue={category?.description}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`icon-${category?.id ?? "new"}`}>
          Ícono (nombre de lucide, ej: mic, image, code)
        </Label>
        <Input
          id={`icon-${category?.id ?? "new"}`}
          name="icon"
          defaultValue={category?.icon}
          placeholder="mic"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`seoTitle-${category?.id ?? "new"}`}>SEO title</Label>
          <Input
            id={`seoTitle-${category?.id ?? "new"}`}
            name="seoTitle"
            defaultValue={category?.seoTitle}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`seoDescription-${category?.id ?? "new"}`}>
            SEO description
          </Label>
          <Textarea
            id={`seoDescription-${category?.id ?? "new"}`}
            name="seoDescription"
            defaultValue={category?.seoDescription}
            rows={2}
            required
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm text-success">Guardado.</p>
      )}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
