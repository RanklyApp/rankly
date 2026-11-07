"use client";

import { ChevronDown, Check, ImageUp, Loader2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { saveLiteAppAction, type LiteFormState } from "@/app/dashboard/lite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const GLASS_BASE = cn(
  "rounded-lg text-sm backdrop-blur-md",
  "border border-white/[0.08] bg-white/[0.04] dark:bg-white/[0.05]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.25)]",
  "transition-[color,box-shadow,border-color] duration-150 ease-snappy",
  "focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/25",
  "focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_18px_-4px_rgba(59,130,246,0.6)]",
);
const FIELD_CLASS = cn(GLASS_BASE, "h-11");

const DESC_MAX = 600;
const TAGLINE_MAX = 80;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
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
  hideLabel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={name}
        className={cn("text-[13px] font-medium text-white/70", hideLabel && "sr-only")}
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

export function LiteBusinessForm({
  appId,
  logoUrl: initialLogoUrl,
  defaultValues,
  categories,
}: {
  appId: string;
  logoUrl: string | null;
  defaultValues: {
    name: string;
    tagline: string;
    categoryId: string;
    websiteUrl: string;
    description: string;
    ownerEmail: string;
  };
  categories: { id: string; name: string }[];
}) {
  const [state, dispatch, isPending] = useActionState<LiteFormState, FormData>(
    saveLiteAppAction,
    {},
  );

  const [descLen, setDescLen] = useState(defaultValues.description.length);
  const [taglineLen, setTaglineLen] = useState(defaultValues.tagline.length);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

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

  const errors = state.errors ?? {};
  const descNearLimit = descLen > DESC_MAX * 0.9;
  const taglineNearLimit = taglineLen > TAGLINE_MAX * 0.9;
  const currentLogo = logoPreview ?? initialLogoUrl;

  return (
    <form action={dispatch} noValidate className="space-y-8">
      <input type="hidden" name="appId" value={appId} />

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

        <Field
          label={`Resumen (${taglineLen}/${TAGLINE_MAX})`}
          name="tagline"
          hint="Una línea que describe tu negocio en el ranking."
          error={errors.tagline}
        >
          <div className="relative">
            <Input
              id="tagline"
              name="tagline"
              maxLength={TAGLINE_MAX}
              defaultValue={defaultValues.tagline}
              onChange={(e) => setTaglineLen(e.target.value.length)}
              className={FIELD_CLASS}
            />
            <span
              className={cn(
                "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums",
                taglineNearLimit ? "text-[#FBBF24]" : "text-muted-foreground",
              )}
            >
              {taglineLen}/{TAGLINE_MAX}
            </span>
          </div>
        </Field>

        <Field label="Categoría" name="categoryId" error={errors.categoryId}>
          <div className="relative">
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={defaultValues.categoryId}
              className={cn(FIELD_CLASS, "w-full appearance-none px-3 pr-9 text-white outline-none")}
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
        <Field label="Descripción" name="description" error={errors.description} hideLabel>
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
              {currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Logo actual"
                  width={48}
                  height={48}
                  className="size-full object-cover"
                  unoptimized={!!logoPreview}
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

      <Section title="Contacto">
        <Field
          label="Email de contacto"
          name="ownerEmail"
          hint="Para que te contactemos sobre tu ficha."
          error={errors.ownerEmail}
        >
          <Input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            defaultValue={defaultValues.ownerEmail}
            className={FIELD_CLASS}
          />
        </Field>
      </Section>

      <div className="space-y-4">
        {state.message && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.ok && !state.message && (
          <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <Check className="size-4" aria-hidden />
            Cambios guardados.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className={cn(
              "sm:min-w-44",
              "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-6px_rgba(59,130,246,0.7)]",
              "hover:shadow-[0_2px_6px_rgba(0,0,0,0.35),0_12px_30px_-6px_rgba(59,130,246,0.85)]",
            )}
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
