// Max number of paid apps shown in the promoted block per page load.
// If more paid apps exist, they rotate across loads (see rankApps) so the
// first screen is never 100% ads — that would spike bounce and destroy the
// very traffic advertisers are paying for.
export const MAX_PROMOTED = 5;

// Apps per page in category listings (keeps LCP low on large categories).
export const PAGE_SIZE = 24;

// The single site operator. When this email is the logged-in user, the
// dashboard shows an extra "all businesses" management block (delete). There is
// no separate /admin route — this is the only admin surface.
export const ADMIN_EMAIL = "garciamariaa1983@gmail.com";

// --- First-place gamification ---
// A business accrues real seconds spent at the global #1 spot (highest paid
// daily bid across the directory). Reaching the thresholds unlocks plaques.
export const SECONDS_PER_DAY = 86_400;
export const FIRST_PLACE_SILVER_DAYS = 50;
export const FIRST_PLACE_GOLD_DAYS = 100;
// 50 days = 4_320_000 s (silver plaque), 100 days = 8_640_000 s (gold plaque).
export const FIRST_PLACE_SILVER_SECONDS =
  FIRST_PLACE_SILVER_DAYS * SECONDS_PER_DAY;
export const FIRST_PLACE_GOLD_SECONDS = FIRST_PLACE_GOLD_DAYS * SECONDS_PER_DAY;
// Cap on seconds credited in a single accrual tick, so a long scheduler outage
// can't dump many hours/days of credit onto whoever holds #1 at that moment.
export const ACCRUAL_MAX_DELTA_SECONDS = 3_600;

export const SITE_NAME = "SaaS Rank";
export const SITE_DESCRIPTION =
  "Encontrá la herramienta de IA que necesitás. Directorio curado de aplicaciones SaaS con inteligencia artificial, por categoría.";
