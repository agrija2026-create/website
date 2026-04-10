import type { MetadataRoute } from "next";
import { getAllArticles, getAllTagUrlParams } from "@/lib/articles";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { absoluteUrl } from "@/lib/site";
import { isAudienceTagPath } from "@/lib/tags";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, tagParams] = await Promise.all([
    getAllArticles(),
    getAllTagUrlParams(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/recent"), changeFrequency: "daily", priority: 0.8 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: absoluteUrl(`/categories/${slug}`),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const tagEntries: MetadataRoute.Sitemap = tagParams
    .filter(isAudienceTagPath)
    .map((slug) => ({
      url: absoluteUrl(`/tags/${slug}`),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: absoluteUrl(`/articles/${a.slug}`),
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...tagEntries, ...articleEntries];
}
