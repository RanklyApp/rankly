import { SITE_NAME } from "./constants";

/** Canonical site origin, no trailing slash. */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

interface AppLd {
  name: string;
  tagline: string;
  description: string;
  category: string;
  logoUrl: string;
  slug: string;
}

/** schema.org SoftwareApplication for an app detail page. */
export function softwareApplicationLd(app: AppLd) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    applicationCategory: app.category,
    operatingSystem: "Web",
    description: app.description || app.tagline,
    image: app.logoUrl,
    url: absoluteUrl(`/app/${app.slug}`),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  } as const;
}

interface Crumb {
  name: string;
  path: string;
}

/** schema.org BreadcrumbList. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  } as const;
}

/** Renders a JSON-LD <script> payload as a string for dangerouslySetInnerHTML. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export { SITE_NAME };
