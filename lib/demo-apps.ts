import type { AppListItem } from "@/components/app-list";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — catalog of real SaaS products, shared by the public landing and
// the owner dashboard. No fictional/placeholder apps (see AGENTS.md: never fake
// data). Real approved businesses from the DB are appended to this list.
//
// PLACEHOLDER "Destacado" AMOUNTS — TEMPORARY, remove when real billing (Polar)
// starts. A few real apps below carry `paid: true` + an EXAMPLE `dailyAmountCents`
// only so the promoted podium renders before anyone actually pays. These are NOT
// real advertisers and pay nothing. When a business starts paying for real, drop
// its `paid`/`dailyAmountCents` here (the amount will come from the DB instead):
//   - Rezi     → dailyAmountCents 800 ($8/día) — well-known #1 resume builder
//   - Chatbase → dailyAmountCents 500 ($5/día) — popular, distinct category (Chatbots)
//   - Cometly  → dailyAmountCents 300 ($3/día) — surfaces the new Marketing y SEO cat
// Picked for name recognition + category spread so the podium looks representative.
//
// `dailyAmountCents` = daily amount in cents (matches AppListItem + formatDailyAmount).
// Replace this file with real DB data once submission + moderation is wired.
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_APPS: AppListItem[] = [
  {
    name: "Rezi",
    tagline: "El creador de currículums con IA #1",
    description:
      "Genera currículums optimizados para sistemas ATS, cartas de presentación y practica entrevistas con IA.",
    category: "Escritura",
    url: "https://www.rezi.ai",
    paid: true, // PLACEHOLDER destacado — remove when real billing starts
    dailyAmountCents: 800,
  },
  {
    name: "Chatbase",
    tagline: "Armá un chatbot con IA para tu web en minutos",
    description:
      "Creá un chatbot entrenado con tus propios datos para responder consultas de soporte y ventas en tu sitio.",
    category: "Chatbots",
    url: "https://www.chatbase.co",
    paid: true, // PLACEHOLDER destacado — remove when real billing starts
    dailyAmountCents: 500,
  },
  {
    name: "Cometly",
    tagline: "Sabé qué anuncio generó cada venta",
    description:
      "Atribución de marketing con IA para SaaS B2B: conecta cada click de anuncio con los ingresos reales en Stripe.",
    category: "Marketing y SEO",
    url: "https://www.cometly.com",
    paid: true, // PLACEHOLDER destacado — remove when real billing starts
    dailyAmountCents: 300,
  },
  {
    name: "Bustem",
    tagline: "Frená a los que copian tu marca",
    description:
      "Servicio de detección y remoción (DMCA) de sitios falsos, productos pirata y uso no autorizado de tu marca.",
    category: "Automatización",
    url: "https://bustem.com",
  },
  {
    name: "Aplano",
    tagline: "Turnos y fichaje de personal sin planillas",
    description:
      "Software de gestión de turnos, fichaje de horarios y ausencias para equipos que trabajan por turnos.",
    category: "Productividad",
    url: "https://www.getaplano.com",
  },
  {
    name: "Kibu",
    tagline: "Menos papeleo, más cuidado real",
    description:
      "Plataforma con IA para documentación, cumplimiento y contenido para proveedores de servicios a personas con discapacidad.",
    category: "Productividad",
    url: "https://kibu.com",
  },
  {
    name: "Postiz",
    tagline: "Redes sociales en piloto automático con IA",
    description:
      "Programa, genera y publica contenido en más de 30 redes sociales usando agentes de IA, todo en un calendario visual.",
    category: "Redes sociales",
    url: "https://postiz.com",
  },
  {
    name: "Supliful",
    tagline: "Lanzá tu marca de suplementos sin inventario",
    description:
      "Plataforma de print-on-demand para vender suplementos, café y cosmética con tu propia marca, sin inventario.",
    category: "E-commerce",
    url: "https://supliful.com",
  },
  {
    name: "BIG",
    tagline: "Convertí manejar tu negocio en un juego",
    description:
      "Plataforma que gamifica la gestión de tu negocio con metas, misiones y recompensas para mantenerte motivado.",
    category: "Productividad",
    url: "https://playrealbig.com",
  },
  {
    name: "Upscale B2B",
    tagline: "Generación de leads B2B, con prueba incluida",
    description:
      "Servicio gestionado de generación de leads B2B con período de prueba antes de contratar.",
    category: "Ventas y leads",
    url: "https://upscaleb2b.com",
  },
  {
    name: "Codédex",
    tagline: "Aprendé a programar como una aventura",
    description:
      "Plataforma gamificada para aprender Python, HTML, CSS y JavaScript a tu ritmo, con misiones e insignias.",
    category: "Código",
    url: "https://www.codedex.io",
  },
  {
    name: "Supergrow",
    // TODO: copiar del sitio oficial
    tagline: "",
    description: "",
    category: "Copywriting",
    url: "https://www.supergrow.ai",
  },
  {
    name: "LLM Gateway",
    tagline: "Una sola API para más de 40 modelos de IA",
    description:
      "Conectá tu app a OpenAI, Anthropic, Google y 40+ proveedores de IA a través de una sola API unificada.",
    category: "Código",
    url: "https://llmgateway.io",
  },
  {
    name: "Muxa",
    tagline: "Convertí tus letras en canciones con IA",
    description:
      "App que genera canciones completas (letra, melodía y voz) a partir de un prompt o tus propias letras.",
    category: "Voz y audio",
    url: "https://apps.apple.com/us/app/muxa-ai-music-songmaker/id6503041526",
  },
  {
    name: "Vid.ai",
    tagline: "Videos profesionales sin editar nada",
    description:
      "Generador de video con IA: convierte texto en videos con voces, subtítulos y marca propia en minutos.",
    category: "Video",
    url: "https://vid.ai",
  },
  {
    name: "GoTall",
    tagline: "Predecí tu altura y trabajá para maximizarla",
    description:
      "App que predice tu altura adulta según genética, nutrición y ejercicio, y te da un plan personalizado para maximizarla.",
    category: "Salud y bienestar",
    url: "https://www.gotall.app",
  },
  {
    name: "Gojiberry AI",
    tagline: "Tu agente de ventas que nunca duerme",
    description:
      "Agente de IA que encuentra leads con intención de compra y les hace outreach automático por email y redes.",
    category: "Ventas y leads",
    url: "https://gojiberry.ai",
  },
  {
    name: "Stan Store",
    tagline: "Tu tienda digital en un link",
    description:
      "Plataforma todo-en-uno para creadores: vendé cursos, coaching y productos digitales desde una sola página de link-in-bio.",
    category: "Productividad",
    url: "https://www.stan.store",
  },
  {
    name: "AEO Engine",
    tagline: "Que la IA te cite, no solo Google",
    description:
      "Herramienta de optimización para que tu marca aparezca citada en ChatGPT, Perplexity y AI Overviews de Google, además del SEO tradicional.",
    category: "Marketing y SEO",
    url: "https://aeoengine.ai",
  },
];
