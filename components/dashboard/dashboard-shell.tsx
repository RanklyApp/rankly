"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { AppList, type AppListItem } from "@/components/app-list";
import { BidForm } from "@/components/bid-form";
import { HeaderCta } from "@/components/header-cta";
import { RewardsTab } from "@/components/dashboard/rewards-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ─── Tab nav ─────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "rewards", label: "Recompensas" },
  { id: "competition", label: "Competencia" },
  { id: "business", label: "Mi Negocio" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeEl = refs.current[active];

  return (
    <nav
      role="tablist"
      aria-label="Secciones del panel"
      className="relative flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/3 p-1"
    >
      {activeEl && (
        <span
          className="pointer-events-none absolute rounded-lg bg-white/10 transition-all duration-200"
          style={{
            left: activeEl.offsetLeft + 4,
            width: activeEl.offsetWidth - 8,
            top: 4,
            height: "calc(100% - 8px)",
          }}
          aria-hidden
        />
      )}
      {TABS.map((t) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[t.id] = el; }}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative z-10 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "active:scale-[0.97]",
            active === t.id ? "text-white" : "text-white/40 hover:text-white/65",
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* ─── Dashboard header ────────────────────────────────────────────────────── */

function DashboardHeader({
  businessName,
  logoUrl,
  currentRank,
}: {
  businessName: string;
  logoUrl: string | null;
  currentRank: number;
}) {
  const badge =
    currentRank === 1
      ? "Líder del ranking"
      : currentRank <= 3
        ? `Puesto #${currentRank}`
        : `Posición #${currentRank}`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-xl border border-white/12"
          style={{ width: 44, height: 44 }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo de ${businessName}`}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/6 text-base font-bold text-white/50">
              {businessName[0]}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1
            className="truncate text-xl font-extrabold leading-tight tracking-tight text-white"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            {businessName}
          </h1>
          <p className="text-xs text-white/38">{badge}</p>
        </div>
      </div>
      <div className="shrink-0">
        <HeaderCta />
      </div>
    </div>
  );
}

/* ─── Competition tab ─────────────────────────────────────────────────────── */

function CompetitionTab({
  appId,
  initialBidDollars,
  ranking,
  showAmounts,
}: {
  appId: string;
  initialBidDollars: number;
  ranking: AppListItem[];
  showAmounts: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Bid form — top */}
      <div className="shrink-0 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-white/35">
          Tu monto diario
        </p>
        <BidForm appId={appId} initialDollars={initialBidDollars} />
      </div>

      {/* Ranking — scrollable below */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppList apps={ranking} showAmounts={showAmounts} />
      </div>
    </div>
  );
}

/* ─── Mi Negocio tab ──────────────────────────────────────────────────────── */

type FieldErrors = Partial<Record<string, string[]>>;

function BusinessTab({
  appId,
  logoUrl,
  defaultValues,
  categories,
}: {
  appId: string;
  logoUrl: string | null;
  defaultValues: {
    name: string;
    categoryId: string;
    websiteUrl: string;
    description: string;
  };
  categories: { id: string; name: string }[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [descLen, setDescLen] = useState(defaultValues.description.length);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        if (data.errors) setErrors(data.errors as FieldErrors);
        if (data.message) setMessage(data.message);
      }
    } catch {
      setMessage("Problema de conexión. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentLogo = preview ?? logoUrl;

  return (
    <div className="h-full overflow-y-auto">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-lg space-y-5 py-2 pb-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/12">
            {currentLogo ? (
              <Image
                src={currentLogo}
                alt="Logo actual"
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={!!preview}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/6 text-xl font-bold text-white/40">
                {defaultValues.name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="logo" className="text-xs text-white/55">
              Logo (PNG, JPG, WEBP o SVG · máx 1 MB)
            </Label>
            <label
              htmlFor="logo"
              className={cn(
                "mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15",
                "px-3 py-2 text-xs text-white/40 transition-colors hover:border-white/30 hover:text-white/60",
                "focus-within:border-ring focus-within:outline-none",
              )}
            >
              <Upload className="size-3.5 shrink-0" />
              <span>Reemplazar logo</span>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={handleLogoChange}
              />
            </label>
            {errors.logo && (
              <p className="mt-1 text-xs text-destructive">{errors.logo[0]}</p>
            )}
          </div>
        </div>

        {/* Nombre */}
        <FormField label="Nombre público" error={errors.name}>
          <Input
            id="name"
            name="name"
            required
            maxLength={60}
            defaultValue={defaultValues.name}
          />
        </FormField>

        {/* Categoría */}
        <FormField label="Categoría" error={errors.categoryId}>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={defaultValues.categoryId}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm",
              "shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#101f45]">
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* URL */}
        <FormField label="Sitio web" error={errors.websiteUrl}>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            required
            defaultValue={defaultValues.websiteUrl}
          />
        </FormField>

        {/* Descripción */}
        <FormField
          label={`Descripción (${descLen}/600)`}
          hint="Contá qué hace tu negocio y qué problema resuelve."
          error={errors.description}
        >
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={600}
            defaultValue={defaultValues.description}
            onChange={(e) => setDescLen(e.target.value.length)}
            placeholder="Ej.: transcribe reuniones y arma resúmenes con los puntos clave."
          />
        </FormField>

        {/* Error banner */}
        {message && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={submitting}
            className="transition-transform active:scale-[0.97]"
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </Button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" strokeWidth={2.5} />
              Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error?.length && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error?.[0] && <p className="text-xs text-destructive">{error[0]}</p>}
    </div>
  );
}

/* ─── Shell ───────────────────────────────────────────────────────────────── */

export interface DashboardShellProps {
  businessName: string;
  logoUrl: string | null;
  userEmail: string;
  appId: string;
  initialBidDollars: number;
  currentRank: number;
  daysAtRank1: number;
  ranking: AppListItem[];
  showAmounts: boolean;
  categories: { id: string; name: string }[];
  appData: {
    name: string;
    categoryId: string;
    websiteUrl: string;
    description: string;
  };
}

export function DashboardShell({
  businessName,
  logoUrl,
  appId,
  initialBidDollars,
  currentRank,
  daysAtRank1,
  ranking,
  showAmounts,
  categories,
  appData,
}: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("rewards");

  return (
    <div className="flex h-dvh flex-col overflow-hidden px-5 py-4 sm:px-8 sm:py-5">
      <DashboardHeader
        businessName={businessName}
        logoUrl={logoUrl}
        currentRank={currentRank}
      />

      <div className="mt-4 shrink-0">
        <TabNav active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {activeTab === "rewards" && (
          <RewardsTab
            businessName={businessName}
            daysAtRank1={daysAtRank1}
            currentRank={currentRank}
          />
        )}

        {activeTab === "competition" && (
          <CompetitionTab
            appId={appId}
            initialBidDollars={initialBidDollars}
            ranking={ranking}
            showAmounts={showAmounts}
          />
        )}

        {activeTab === "business" && (
          <BusinessTab
            appId={appId}
            logoUrl={logoUrl}
            defaultValues={appData}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
}
