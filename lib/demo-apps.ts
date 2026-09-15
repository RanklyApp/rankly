import type { AppListItem } from "@/components/app-list";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — initial catalog of 19 real SaaS products, shared by both the
// public landing and the owner dashboard.
//
// The three "Destacado" slots use clearly fictional placeholder apps so no
// real company is misrepresented as a paying customer.
//
// `monthlyAmountCents` = monthly amount in cents (matches AppListItem + formatMonthlyAmount).
// Replace this file with real DB data once submission + moderation is wired.
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_APPS: AppListItem[] = [
  // ── Destacados (fictional placeholders — paid: true, highest to lowest) ───
  {
    name: "Loopwriter",
    tagline: "Artículos SEO en piloto automático",
    description:
      "Genera y publica artículos SEO optimizados de forma automática, con tu tono de marca y estructura personalizable.",
    category: "Escritura",
    url: "https://example.com",
    logoUrl: "/logos/loopwriter.svg",
    paid: true,
    monthlyAmountCents: 24000,
  },
  {
    name: "Tallyform AI",
    tagline: "Formularios inteligentes que se adaptan solos",
    description:
      "Crea formularios que ajustan sus preguntas en tiempo real según las respuestas del usuario, con análisis automático.",
    category: "Automatización",
    url: "https://example.com",
    logoUrl: "/logos/tallyform-ai.svg",
    paid: true,
    monthlyAmountCents: 18000,
  },
  {
    name: "Nudge Analytics",
    tagline: "Entendé por qué tus usuarios se van",
    description:
      "Analítica de comportamiento que identifica los momentos de fricción y sugiere cambios accionables para reducir el churn.",
    category: "Análisis de datos",
    url: "https://example.com",
    logoUrl: "/logos/nudge-analytics.svg",
    paid: true,
    monthlyAmountCents: 12000,
  },
  // ── Real apps — free ──────────────────────────────────────────────────────
  {
    name: "Rezi",
    tagline: "El creador de currículums con IA #1",
    description:
      "Genera currículums optimizados para sistemas ATS, cartas de presentación y practica entrevistas con IA.",
    category: "Escritura",
    url: "https://www.rezi.ai",
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
    category: "Automatización",
    url: "https://postiz.com",
  },
  {
    name: "Cometly",
    tagline: "Sabé qué anuncio generó cada venta",
    description:
      "Atribución de marketing con IA para SaaS B2B: conecta cada click de anuncio con los ingresos reales en Stripe.",
    category: "Análisis de datos",
    url: "https://www.cometly.com",
  },
  {
    name: "Supliful",
    tagline: "Lanzá tu marca de suplementos sin inventario",
    description:
      "Plataforma de print-on-demand para vender suplementos, café y cosmética con tu propia marca, sin inventario.",
    category: "Automatización",
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
    category: "Automatización",
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
    category: "Análisis de datos",
    url: "https://www.gotall.app",
  },
  {
    name: "Gojiberry AI",
    tagline: "Tu agente de ventas que nunca duerme",
    description:
      "Agente de IA que encuentra leads con intención de compra y les hace outreach automático por email y redes.",
    category: "Automatización",
    url: "https://gojiberry.ai",
  },
  {
    name: "Chatbase",
    tagline: "Armá un chatbot con IA para tu web en minutos",
    description:
      "Creá un chatbot entrenado con tus propios datos para responder consultas de soporte y ventas en tu sitio.",
    category: "Chatbots",
    url: "https://www.chatbase.co",
  },
  {
    name: "Stan Store",
    tagline: "Tu tienda digital en un link",
    description:
      "Plataforma todo-en-uno para creadores: vendé cursos, coaching y productos digitales desde una sola página de link-in-bio.",
    category: "Productividad",
    url: "https://www.stan.store",
  },
];
