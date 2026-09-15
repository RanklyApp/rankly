/**
 * Seed script — loads the fixed CATEGORY taxonomy only.
 *
 * Apps still start empty on purpose: no fake/placeholder apps, ever. Real apps
 * arrive through the public submission form + moderation queue.
 *
 * Categories are different: the submission form needs a fixed, non-free-text
 * list to pick from, so we seed a curated initial set here. Idempotent — safe
 * to re-run (existing slugs are skipped, nothing is duplicated or overwritten).
 *
 * Run manually against your database:  pnpm db:seed
 * (Not part of the startup command. Requires DATABASE_URL.)
 */
import "./env";
import type { NewCategory } from "./schema";
import { getDb, schema } from "./index";

// Initial fixed taxonomy for the SaaS/AI directory. `icon` is a lucide-react
// icon name (kebab-case). Adjust names/copy here; re-running only inserts the
// slugs that don't exist yet.
const CATEGORIES: NewCategory[] = [
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

async function seed() {
  const db = getDb();

  const result = await db
    .insert(schema.categories)
    .values(CATEGORIES)
    .onConflictDoNothing({ target: schema.categories.slug })
    .returning({ slug: schema.categories.slug });

  console.log(
    `Seed done. ${result.length} new categor${result.length === 1 ? "y" : "ies"} inserted ` +
      `(${CATEGORIES.length} in the fixed list; existing slugs skipped). Apps stay empty by design.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
