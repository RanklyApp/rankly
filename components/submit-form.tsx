"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitAppSchema } from "@/lib/validations";

interface SubmitFormProps {
  categories: { id: string; name: string }[];
}

type FieldErrors = Partial<Record<string, string[]>>;

export function SubmitForm({ categories }: SubmitFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    // Client-side Zod pass for instant feedback (server re-validates anyway).
    const check = submitAppSchema.safeParse({
      name: formData.get("name"),
      tagline: formData.get("tagline"),
      description: formData.get("description"),
      websiteUrl: formData.get("websiteUrl"),
      categoryId: formData.get("categoryId"),
      ownerEmail: formData.get("ownerEmail"),
    });
    if (!check.success) {
      setErrors(check.error.flatten().fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDone(true);
        formEl.reset();
        return;
      }
      if (data.errors) setErrors(data.errors as FieldErrors);
      if (data.message) setMessage(data.message);
    } catch {
      setMessage("Hubo un problema de conexión. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-5" aria-hidden />
          <p className="font-medium">¡Recibimos tu app!</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Queda en la cola de moderación. Cuando la aprobemos, va a aparecer en
          el directorio.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button variant="ghost" onClick={() => setDone(false)}>
            Publicar otra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Nombre" name="name" error={errors.name}>
        <Input id="name" name="name" required maxLength={60} />
      </Field>

      <Field
        label="Categoría"
        name="categoryId"
        error={errors.categoryId}
      >
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue=""
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Elegí una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Descripción de una línea"
        name="tagline"
        hint="Máximo 80 caracteres. Qué hace, en pocas palabras."
        error={errors.tagline}
      >
        <Input id="tagline" name="tagline" required maxLength={80} />
      </Field>

      <Field
        label="Descripción"
        name="description"
        hint="Contá qué resuelve y para quién."
        error={errors.description}
      >
        <Textarea id="description" name="description" required rows={4} maxLength={600} />
      </Field>

      <Field label="Sitio web" name="websiteUrl" error={errors.websiteUrl}>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://…"
          required
        />
      </Field>

      <Field
        label="Logo"
        name="logo"
        hint="PNG, JPG, WEBP o SVG. Máximo 1 MB."
        error={errors.logo}
      >
        <Input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          required
          className="cursor-pointer"
        />
      </Field>

      <Field
        label="Tu email de contacto"
        name="ownerEmail"
        hint="No lo publicamos. Lo usamos para avisarte y para que reclames la ficha."
        error={errors.ownerEmail}
      >
        <Input id="ownerEmail" name="ownerEmail" type="email" required />
      </Field>

      {message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Enviando…" : "Enviar para revisión"}
      </Button>
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
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && error.length > 0 && (
        <p className="text-xs text-destructive">{error[0]}</p>
      )}
    </div>
  );
}
