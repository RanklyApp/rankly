import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { apps, categories } = await getSitemapEntries();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/categorias"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/submit"), changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/c/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((a) => ({
    url: absoluteUrl(`/app/${a.slug}`),
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...appRoutes];
}
