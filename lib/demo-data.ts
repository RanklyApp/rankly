/**
 * Demo data layer — active when DATABASE_URL is not set.
 *
 * Derives Category[] and App[] (with category join) from DEMO_APPS so every
 * query in queries.ts can return something navigable in local dev without a DB.
 *
 * IDs are stable strings (not real UUIDs) — fine for dev, never reach the DB.
 */
import type { App, Category } from "@/db/schema";
import { DEMO_APPS } from "@/lib/demo-apps";

export type AppWithCategory = App & { category: Category };

// ---------------------------------------------------------------------------
// Categories — mirrors db/seed.ts taxonomy exactly (same slugs/names).
// ---------------------------------------------------------------------------
const RAW_CATEGORIES: Omit<Category, "id">[] = [
  {
    slug: "transcripcion",
    name: "Transcripción",
    description: "Herramientas que transcriben audio, reuniones y llamadas.",
    icon: "mic",
    seoTitle: "Herramientas de transcripción con IA",
    seoDescription:
      "Las mejores apps de IA para transcribir reuniones, llamadas y audio a texto.",
  },
  {
    slug: "generacion-de-imagenes",
    name: "Generación de imágenes",
    description: "Generación y edición de imágenes y assets visuales con IA.",
    icon: "image",
    seoTitle: "Generadores de imágenes con IA",
    seoDescription:
      "Apps de IA para generar imágenes, ilustraciones y assets de marca a partir de texto.",
  },
  {
    slug: "copywriting",
    name: "Copywriting",
    description: "Redacción de textos de marketing y ventas con IA.",
    icon: "pen-tool",
    seoTitle: "Herramientas de copywriting con IA",
    seoDescription:
      "Apps de IA para escribir anuncios, emails y copy de ventas que convierte.",
  },
  {
    slug: "escritura",
    name: "Escritura",
    description: "Asistentes de escritura para contenido y textos largos.",
    icon: "pen-line",
    seoTitle: "Asistentes de escritura con IA",
    seoDescription:
      "Apps de IA para redactar artículos, guías y contenido largo con tono consistente.",
  },
  {
    slug: "codigo",
    name: "Código",
    description: "Asistentes de programación y autocompletado de código.",
    icon: "code",
    seoTitle: "Asistentes de código con IA",
    seoDescription:
      "Apps de IA para autocompletar, explicar y refactorizar código en tu editor.",
  },
  {
    slug: "voz-y-audio",
    name: "Voz y audio",
    description: "Síntesis de voz, clonado y procesamiento de audio.",
    icon: "audio-lines",
    seoTitle: "Herramientas de voz y audio con IA",
    seoDescription:
      "Apps de IA para convertir texto en voz, clonar voces y procesar audio.",
  },
  {
    slug: "productividad",
    name: "Productividad",
    description: "Notas, tareas y asistentes para trabajar más rápido.",
    icon: "list-checks",
    seoTitle: "Herramientas de productividad con IA",
    seoDescription:
      "Apps de IA para tomar notas, organizar tareas y automatizar tu día a día.",
  },
  {
    slug: "chatbots",
    name: "Chatbots",
    description: "Agentes conversacionales y bots de atención al cliente.",
    icon: "message-circle",
    seoTitle: "Chatbots y agentes con IA",
    seoDescription:
      "Apps de IA para crear chatbots y agentes de atención al cliente 24/7.",
  },
  {
    slug: "diseno",
    name: "Diseño",
    description: "Diseño gráfico, UI y edición visual asistidos por IA.",
    icon: "palette",
    seoTitle: "Herramientas de diseño con IA",
    seoDescription:
      "Apps de IA para diseño gráfico, edición de fotos e interfaces.",
  },
  {
    slug: "analisis-de-datos",
    name: "Análisis de datos",
    description: "Consulta y visualización de datos en lenguaje natural.",
    icon: "chart-bar",
    seoTitle: "Análisis de datos con IA",
    seoDescription:
      "Apps de IA para consultar datos en lenguaje natural y generar gráficos.",
  },
  {
    slug: "traduccion",
    name: "Traducción",
    description: "Traducción de textos y documentos con IA.",
    icon: "languages",
    seoTitle: "Herramientas de traducción con IA",
    seoDescription:
      "Apps de IA para traducir textos y documentos conservando el formato.",
  },
  {
    slug: "presentaciones",
    name: "Presentaciones",
    description: "Generación de slides y presentaciones con IA.",
    icon: "presentation",
    seoTitle: "Generadores de presentaciones con IA",
    seoDescription:
      "Apps de IA para convertir un brief o documento en una presentación lista.",
  },
  {
    slug: "resumenes",
    name: "Resúmenes",
    description: "Resúmenes de textos, videos, reuniones y podcasts.",
    icon: "scroll-text",
    seoTitle: "Herramientas de resúmenes con IA",
    seoDescription:
      "Apps de IA para resumir documentos, videos y reuniones en puntos clave.",
  },
  {
    slug: "video",
    name: "Video",
    description: "Generación y edición de video con IA.",
    icon: "video",
    seoTitle: "Herramientas de video con IA",
    seoDescription:
      "Apps de IA para generar, editar y subtitular videos automáticamente.",
  },
  {
    slug: "automatizacion",
    name: "Automatización",
    description: "Automatización de flujos de trabajo y tareas repetitivas.",
    icon: "workflow",
    seoTitle: "Herramientas de automatización con IA",
    seoDescription:
      "Apps de IA para automatizar flujos de trabajo e integrar tus herramientas.",
  },
];

export const DEMO_CATEGORIES: Category[] = RAW_CATEGORIES.map((c, i) => ({
  ...c,
  id: `demo-cat-${String(i).padStart(2, "0")}`,
}));

const categoryByName = new Map(DEMO_CATEGORIES.map((c) => [c.name, c]));

// ---------------------------------------------------------------------------
// Apps — converts AppListItem[] → (App & { category })[]
// ---------------------------------------------------------------------------
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EPOCH = new Date("2025-01-01T00:00:00Z");

export const DEMO_APP_RECORDS: AppWithCategory[] = DEMO_APPS.map((a, i) => {
  const category = categoryByName.get(a.category) ?? DEMO_CATEGORIES[0];
  return {
    id: `demo-app-${String(i).padStart(2, "0")}`,
    slug: slugify(a.name),
    name: a.name,
    tagline: a.tagline,
    description: a.description ?? a.tagline,
    websiteUrl: a.url,
    logoUrl: a.logoUrl ?? "",
    categoryId: category.id,
    ownerUserId: null,
    ownerEmail: "",
    status: "approved" as const,
    plan: a.paid ? ("paid" as const) : ("free" as const),
    monthlyAmountCents: a.monthlyAmountCents ?? 0,
    stripeSubscriptionId: null,
    clicksCount: 0,
    createdAt: EPOCH,
    category,
  };
});

/** Strip the joined `category` field to get a plain App. */
export function toApp({ category: _c, ...app }: AppWithCategory): App {
  return app;
}

export const DEMO_APPS_ONLY: App[] = DEMO_APP_RECORDS.map(toApp);
