"use client";

import { Check, ChevronDown, ImageUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  /**
   * Where to go after a successful save / on cancel. Set on the standalone edit
   * page (`/dashboard/editar/[id]`) so it navigates back to the panel. Omit when
   * the form is embedded in the dashboard tab: there `/dashboard` is the current
   * route, so navigating is a no-op — instead the form saves in place, shows a
   * success note, resets, and refreshes.
   */
  redirectHref?: string;
}

type FieldErrors = Partial<Record<string, string[]>>;

const DESC_MAX = 600;

// The field itself IS the liquid-glass slab — no container card. A faint
// translucent white fill (not the saturated blue), a lit top highlight + soft
// edge instead of a hard gray border, backdrop blur, and a blue focus glow.
const GLASS_BASE = cn(
  "rounded-lg text-sm backdrop-blur-md",
  "border border-white/[0.08] bg-white/[0.04] dark:bg-white/[0.05]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.25)]",
  "transition-[color,box-shadow,border-color] duration-150 ease-snappy",
  "focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/25",
  "focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_18px_-4px_rgba(59,130,246,0.6)]",
);
const FIELD_CLASS = cn(GLASS_BASE, "h-11");

export function EditAppForm({
  appId,
  defaultValues,
  categories,
  redirectHref,
}: EditAppFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [descLen, setDescLen] = useState(defaultValues.description.length);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Drop the pending logo selection + its preview (after save or on cancel). */
  function clearLogo() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setLogoPreview(null);
    setLogoName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onCancel() {
    if (redirectHref) {
      router.push(redirectHref);
      return;
    }
    // Embedded: discard edits by resetting uncontrolled fields to their defaults.
    formRef.current?.reset();
    setDescLen(defaultValues.description.length);
    setErrors({});
    setMessage(null);
    setSaved(false);
    clearLogo();
  }

  // Revoke the last object URL on change/unmount so previews don't leak.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    if (file) {
      const url = URL.createObjectURL(file);
      previewRef.current = url;
      setLogoPreview(url);
      setLogoName(file.name);
    } else {
      previewRef.current = null;
      setLogoPreview(null);
      setLogoName(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSaved(false);

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
        if (redirectHref) {
          // Standalone edit page: leave for the panel.
          router.push(redirectHref);
          router.refresh();
          return;
        }
        // Embedded in the dashboard tab: save in place. Reset the loading
        // state (we're not navigating away), confirm, drop the logo selection
        // now that it's persisted, and refresh so the rest of the panel updates.
        setSubmitting(false);
        setSaved(true);
        clearLogo();
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

  const descNearLimit = descLen > DESC_MAX * 0.9;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onInput={() => saved && setSaved(false)}
      noValidate
      className="space-y-8"
    >
      <Section title="Información básica">
        <Field label="Nombre público" name="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            required
            maxLength={60}
            defaultValue={defaultValues.name}
            className={FIELD_CLASS}
          />
        </Field>

        <Field label="Categoría" name="categoryId" error={errors.categoryId}>
          <div className="relative">
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={defaultValues.categoryId}
              className={cn(
                FIELD_CLASS,
                "w-full appearance-none px-3 pr-9 text-white outline-none",
              )}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </Field>
      </Section>

      <Section title="Presencia web">
        <Field label="Sitio web" name="websiteUrl" error={errors.websiteUrl}>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            required
            defaultValue={defaultValues.websiteUrl}
            className={FIELD_CLASS}
          />
        </Field>
      </Section>

      <Section title="Descripción">
        <Field
          label="Descripción"
          name="description"
          error={errors.description}
          hideLabel
        >
          <div className="relative">
            <Textarea
              id="description"
              name="description"
              rows={5}
              maxLength={DESC_MAX}
              defaultValue={defaultValues.description}
              onChange={(e) => setDescLen(e.target.value.length)}
              placeholder="Ej.: transcribe reuniones y arma resúmenes con los puntos clave."
              className={cn(GLASS_BASE, "min-h-[132px] resize-none pb-8")}
            />
            <span
              className={cn(
                "pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums",
                descNearLimit ? "text-[#FBBF24]" : "text-muted-foreground",
              )}
            >
              {descLen}/{DESC_MAX}
            </span>
          </div>
        </Field>
      </Section>

      <Section title="Imagen">
        <Field label="Logo" name="logo" error={errors.logo} hideLabel>
          <label
            htmlFor="logo"
            className={cn(
              "group flex cursor-pointer items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-4 backdrop-blur-md",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.25)]",
              "transition-colors duration-150 ease-snappy hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/[0.06]",
              "focus-within:border-[#3B82F6] focus-within:ring-[3px] focus-within:ring-[#3B82F6]/25",
            )}
          >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Vista previa del logo"
                  className="size-full object-cover"
                />
              ) : (
                <ImageUp className="size-5 text-muted-foreground" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {logoName ?? "Reemplazar logo (opcional)"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Cuadrada (1:1). PNG, JPG, WEBP o SVG, hasta 1 MB.
              </span>
            </span>
            <span className="shrink-0 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-white/80 transition-colors group-hover:border-[#3B82F6]/50 group-hover:text-white">
              {logoName ? "Cambiar" : "Examinar"}
            </span>
            <input
              ref={fileRef}
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={onLogoChange}
            />
          </label>
        </Field>
      </Section>

      <div className="space-y-4">
        {message && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        )}
        {saved && !message && (
          <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <Check className="size-4" aria-hidden />
            Cambios guardados.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-white sm:min-w-28"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className={cn(
              "sm:min-w-44",
              "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-6px_rgba(59,130,246,0.7)]",
              "hover:shadow-[0_2px_6px_rgba(0,0,0,0.35),0_12px_30px_-6px_rgba(59,130,246,0.85)]",
            )}
          >
            {submitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            {submitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    // No container card: a minimalist title, then the fields themselves are the
    // glass slabs. Tight title→fields, generous gap to the next section
    // (form-level space-y).
    <section>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  hideLabel,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
  /** Hide the visible label (the card title already names it) but keep it for
   *  screen readers and the htmlFor association. */
  hideLabel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={name}
        className={cn(
          "text-[13px] font-medium text-white/70",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && error.length > 0 && (
        <p className="text-xs text-destructive">{error[0]}</p>
      )}
    </div>
  );
}
