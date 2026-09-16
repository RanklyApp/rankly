"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editAppSchema } from "@/lib/validations";

interface EditAppFormProps {
  appId: string;
  defaultValues: {
    name: string;
    categoryId: string;
    websiteUrl: string;
    description: string;
  };
  categories: { id: string; name: string }[];
}

type FieldErrors = Partial<Record<string, string[]>>;

export function EditAppForm({ appId, defaultValues, categories }: EditAppFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [descLen, setDescLen] = useState(defaultValues.description.length);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    const check = editAppSchema.safeParse({
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      websiteUrl: formData.get("websiteUrl"),
      description: formData.get("description"),
    });
    if (!check.success) {
      setErrors(check.error.flatten().fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      if (data.errors) setErrors(data.errors as FieldErrors);
      if (data.message) setMessage(data.message);
      setSubmitting(false);
    } catch {
      setMessage("Hubo un problema de conexión. Probá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Nombre público" name="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          required
          maxLength={60}
          defaultValue={defaultValues.name}
        />
      </Field>

      <Field label="Categoría" name="categoryId" error={errors.categoryId}>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultValues.categoryId}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sitio web" name="websiteUrl" error={errors.websiteUrl}>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://…"
          required
          defaultValue={defaultValues.websiteUrl}
        />
      </Field>

      <Field
        label={`Descripción (${descLen}/600 caracteres)`}
        name="description"
        hint="Contá qué hace el negocio y qué problema resuelve."
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={5}
          maxLength={600}
          defaultValue={defaultValues.description}
          onChange={(e) => setDescLen(e.target.value.length)}
          placeholder="Ej.: transcribe reuniones y arma resúmenes con los puntos clave."
        />
      </Field>

      <Field
        label="Reemplazar logo (opcional)"
        name="logo"
        hint="Cuadrada (1:1). PNG, JPG, WEBP o SVG, hasta 1 MB. Dejá vacío para conservar el actual."
        error={errors.logo}
      >
        <Input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="cursor-pointer"
        />
      </Field>

      {message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && error.length > 0 && (
        <p className="text-xs text-destructive">{error[0]}</p>
      )}
    </div>
  );
}
