"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Controlled so the selected category is always what React holds — an
  // uncontrolled select could submit an empty value in some browsers even after
  // the user picked one (the "elegí una categoría pese a elegirla" bug).
  const [categoryId, setCategoryId] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    // Guarantee the category from React state reaches the request body,
    // regardless of how the native <select> serialized.
    formData.set("categoryId", categoryId);

    // Client-side Zod pass for instant feedback (server re-validates anyway).
    const check = submitAppSchema.safeParse({
      ownerEmail: formData.get("ownerEmail"),
      password: formData.get("password"),
      name: formData.get("name"),
      categoryId,
      websiteUrl: formData.get("websiteUrl"),
      description: formData.get("description"),
    });
    if (!check.success) {
      setErrors(check.error.flatten().fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apps", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Account + business created and signed in — go straight to the panel.
        router.push(data.redirect ?? "/dashboard");
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
      {/* Honeypot: hidden from humans, catnip for bots. Rejected server-side. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
      >
        <Label htmlFor="company">No completar este campo</Label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field
        label="Email"
        name="ownerEmail"
        hint="Con este email y tu contraseña vas a entrar a tu panel."
        error={errors.ownerEmail}
      >
        <Input
          id="ownerEmail"
          name="ownerEmail"
          type="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field
        label="Contraseña"
        name="password"
        hint="Mínimo 8 caracteres. La usás para volver a entrar a tu panel."
        error={errors.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field
        label="Nombre público"
        name="name"
        hint="El nombre que se muestra en el ranking."
        error={errors.name}
      >
        <Input id="name" name="name" required maxLength={60} />
      </Field>

      <Field label="Categoría" name="categoryId" error={errors.categoryId}>
        <select
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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
        label="Descripción detallada (opcional)"
        name="description"
        hint="Opcional, pero ayuda a que te encuentren: contá qué hace el negocio y qué problema resuelve."
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={600}
          placeholder="Ej.: transcribe reuniones y arma resúmenes con los puntos clave, para equipos que graban muchas llamadas."
        />
      </Field>

      <Field
        label="Imagen del negocio (logo)"
        name="logo"
        hint="Cuadrada (proporción 1:1) para que se vea bien en el ranking. PNG, JPG, WEBP o SVG, hasta 1 MB."
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

      {message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Creando tu cuenta…" : "Crear cuenta y publicar"}
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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && error.length > 0 && (
        <p className="text-xs text-destructive">{error[0]}</p>
      )}
    </div>
  );
}
