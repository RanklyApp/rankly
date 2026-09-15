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

export const SITE_NAME = "SaaS Rank";
export const SITE_DESCRIPTION =
  "Encontrá la herramienta de IA que necesitás. Directorio curado de aplicaciones SaaS con inteligencia artificial, por categoría.";
