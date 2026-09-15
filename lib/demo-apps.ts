import type { AppListItem } from "@/components/app-list";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — hardcoded sample ranking shared by BOTH the public landing and the
// owner dashboard, so the two views always render the exact same set/order/tiers
// from a single source. These are NOT real apps and do NOT come from the DB.
//
// `amountCents` sits on the paid rows but is only revealed when a list is
// rendered with `showAmounts` (owner dashboard); the public view leaves it off.
//
// Paid apps ("Destacado") come first — order = rank shown in the list. Delete
// this file and its two imports (app/page.tsx, app/dashboard/page.tsx) when
// wiring real data.
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_APPS: AppListItem[] = [
  {
    name: "Otterly",
    tagline: "Transcribe tus reuniones y genera resúmenes automáticos",
    description:
      "Subís una grabación y Otterly la transcribe, separa por hablante y arma un resumen con los puntos clave y las tareas pendientes.",
    category: "Transcripción",
    url: "https://example.com",
    paid: true,
    amountCents: 5000, // $50/día
  },
  {
    name: "Framely",
    tagline: "Genera imágenes y assets de marca con IA en segundos",
    description:
      "Creá imágenes, íconos y piezas gráficas con la identidad de tu marca a partir de un prompt de texto, listas para exportar.",
    category: "Generación de imágenes",
    url: "https://example.com",
    paid: true,
    amountCents: 3500, // $35/día
  },
  {
    name: "Copypilot",
    tagline: "Escribí textos de marketing que convierten, en un clic",
    description:
      "Genera anuncios, emails y copy de landing optimizados para conversión, con variantes A/B en segundos.",
    category: "Copywriting",
    url: "https://example.com",
  },
  {
    name: "DevMate",
    tagline: "Autocompleta y explica código directo en tu editor",
    description:
      "Autocompletado y explicaciones de código dentro de tu editor, con contexto de todo el repositorio.",
    category: "Código",
    url: "https://example.com",
  },
  {
    name: "Voxa",
    tagline: "Convertí texto en voz natural en más de 30 idiomas",
    description:
      "Transformá cualquier texto en voz natural en más de 30 idiomas, con voces personalizables y clonado de voz.",
    category: "Voz y audio",
    url: "https://example.com",
  },
  {
    name: "Noted",
    tagline: "Notas inteligentes que se organizan y resumen solas",
    description:
      "Tomás notas y Noted las ordena por tema, las etiqueta y genera un resumen automático de cada sesión.",
    category: "Productividad",
    url: "https://example.com",
  },
  {
    name: "Chatterbox",
    tagline: "Agentes de atención al cliente que responden 24/7",
    description:
      "Agentes de soporte que responden a tus clientes las 24 horas con el tono de tu marca y escalan a un humano cuando hace falta.",
    category: "Chatbots",
    url: "https://example.com",
  },
  {
    name: "Pixelmind",
    tagline: "Editá y mejorá fotos con IA sin abrir Photoshop",
    description:
      "Recortá fondos, mejorá resolución y retocá fotos con IA desde el navegador, sin editores complejos.",
    category: "Diseño",
    url: "https://example.com",
  },
  {
    name: "Datalens",
    tagline: "Preguntale a tus datos en lenguaje natural y obtené gráficos",
    description:
      "Conectás tu base o planilla y le preguntás en lenguaje natural; Datalens responde con gráficos y tablas al instante.",
    category: "Análisis de datos",
    url: "https://example.com",
  },
  {
    name: "Scribely",
    tagline: "Redactá artículos largos con tono de marca consistente",
    description:
      "Redactá artículos y guías largas que mantienen el tono de tu marca, con estructura y SEO cuidados.",
    category: "Escritura",
    url: "https://example.com",
  },
  {
    name: "Translo",
    tagline: "Traducí documentos completos manteniendo el formato",
    description:
      "Traducí documentos enteros conservando formato, tablas e imágenes, en decenas de idiomas.",
    category: "Traducción",
    url: "https://example.com",
  },
  {
    name: "Slideforge",
    tagline: "Convertí un brief en una presentación lista para exponer",
    description:
      "Pegás un brief o documento y Slideforge arma una presentación con diseño y estructura lista para exponer.",
    category: "Presentaciones",
    url: "https://example.com",
  },
  {
    name: "Recapio",
    tagline: "Resúmenes de videos y podcasts en puntos clave",
    description:
      "Pegás un link de video, reunión o podcast y Recapio devuelve un resumen en puntos clave accionables.",
    category: "Resúmenes",
    url: "https://example.com",
  },
  {
    name: "Tunela",
    tagline: "Generá música y pistas de fondo libres de derechos",
    description:
      "Generá música y pistas de fondo libres de derechos por estilo y duración para tus videos y proyectos.",
    category: "Música y audio",
    url: "https://example.com",
  },
];
