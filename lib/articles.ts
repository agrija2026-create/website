import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import { sanitizeTrustedHtml } from "@/lib/sanitizeHtml";
import { validateArticleAudienceTags } from "@/lib/tags";

const articlesDirectory = path.join(process.cwd(), "content/articles");
const sourceHtmlDirectoryPrefix = "content/source-html/";

type DataSource = "local" | "microcms" | "auto";

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  category: string;
  tags: string[];
  sourceHtmlFile?: string;
};

export type Article = ArticleMeta & {
  htmlBody: string;
};

function readLocalArticleFiles(): string[] {
  if (!fs.existsSync(articlesDirectory)) return [];
  return fs
    .readdirSync(articlesDirectory)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => path.join(articlesDirectory, f));
}

function parseDataSource(value: string | undefined): DataSource {
  if (value === "microcms" || value === "auto" || value === "local") {
    return value;
  }
  return "local";
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  if (value === "1" || value.toLowerCase() === "true") return true;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return defaultValue;
}

function getMicroCmsConfig(): {
  serviceDomain: string;
  endpoint: string;
  apiKey: string;
} | null {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN?.trim() ?? "";
  const endpoint = process.env.MICROCMS_ENDPOINT?.trim() || "articles";
  const apiKey = process.env.MICROCMS_API_KEY?.trim() ?? "";
  if (!serviceDomain || !apiKey) return null;
  return { serviceDomain, endpoint, apiKey };
}

function resolveAllowedSourceHtmlPath(sourceHtmlFile: string): string | null {
  const normalized = sourceHtmlFile.replace(/\\/g, "/");
  if (path.isAbsolute(normalized)) return null;
  if (!normalized.startsWith(sourceHtmlDirectoryPrefix)) return null;
  if (normalized.includes("../")) return null;
  return path.join(process.cwd(), normalized);
}

function parseArticleFile(filePath: string): Article {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const d = data as Record<string, unknown>;
  const tagsRaw = d.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String)
    : typeof tagsRaw === "string"
      ? [tagsRaw]
      : [];

  const sourceHtmlFile =
    typeof d.sourceHtmlFile === "string" ? d.sourceHtmlFile : undefined;
  let htmlBody = content.trim();

  if (sourceHtmlFile) {
    const sourcePath = resolveAllowedSourceHtmlPath(sourceHtmlFile);
    if (sourcePath && fs.existsSync(sourcePath)) {
      const sourceRaw = fs.readFileSync(sourcePath, "utf8");
      const articleMatch = sourceRaw.match(/<article[\s\S]*<\/article>/i);
      if (articleMatch?.[0]) {
        htmlBody = articleMatch[0];
      }
    }
  }

  validateArticleAudienceTags(tags, path.basename(filePath));

  return {
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    description: String(d.description ?? ""),
    publishedAt: String(d.publishedAt ?? ""),
    category: String(d.category ?? ""),
    tags,
    sourceHtmlFile,
    htmlBody: sanitizeTrustedHtml(htmlBody),
  };
}

function sortByDateDesc(a: Article, b: Article): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function getAllLocalArticles(): Article[] {
  return readLocalArticleFiles()
    .map(parseArticleFile)
    .filter((a) => a.slug && a.title)
    .sort(sortByDateDesc);
}

type MicroCmsArticle = Record<string, unknown>;

type MicroCmsListResponse = {
  contents?: MicroCmsArticle[];
};

function normalizeMicroCmsArticle(item: MicroCmsArticle): Article | null {
  const title = String(item.title ?? "").trim();
  const slug = String(item.slug ?? item.id ?? "").trim();
  if (!title || !slug) return null;

  const description = String(item.description ?? "").trim();
  const publishedAt = String(item.publishedAt ?? item.createdAt ?? "").trim();

  const categoryRaw = item.category;
  const category =
    typeof categoryRaw === "string"
      ? categoryRaw
      : typeof categoryRaw === "object" &&
          categoryRaw !== null &&
          "slug" in categoryRaw &&
          typeof (categoryRaw as { slug?: unknown }).slug === "string"
        ? String((categoryRaw as { slug: string }).slug)
        : "";

  const tagsRaw = item.tags;
  const tags =
    Array.isArray(tagsRaw)
      ? tagsRaw
          .map((tag) => {
            if (typeof tag === "string") return tag;
            if (
              typeof tag === "object" &&
              tag !== null &&
              "slug" in tag &&
              typeof (tag as { slug?: unknown }).slug === "string"
            ) {
              return String((tag as { slug: string }).slug);
            }
            return "";
          })
          .filter(Boolean)
      : [];

  const bodyCandidate =
    typeof item.bodyHtml === "string"
      ? item.bodyHtml
      : typeof item.htmlBody === "string"
        ? item.htmlBody
        : typeof item.body === "string"
          ? item.body
          : "";

  validateArticleAudienceTags(tags, `microCMS:${slug}`);

  return {
    title,
    slug,
    description,
    publishedAt,
    category,
    tags,
    htmlBody: sanitizeTrustedHtml(bodyCandidate),
  };
}

async function fetchMicroCmsArticles(): Promise<Article[]> {
  const config = getMicroCmsConfig();
  if (!config) {
    throw new Error("microCMS config is missing");
  }

  const url = `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}?limit=100`;
  const res = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": config.apiKey,
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`microCMS request failed: ${res.status}`);
  }
  const json = (await res.json()) as MicroCmsListResponse;
  return (json.contents ?? [])
    .map(normalizeMicroCmsArticle)
    .filter((article): article is Article => article !== null)
    .sort(sortByDateDesc);
}

const getAllArticlesInternal = cache(async (): Promise<Article[]> => {
  const mode = parseDataSource(process.env.ARTICLE_DATA_SOURCE);
  const fallbackToLocal = parseBooleanFlag(
    process.env.ARTICLE_FALLBACK_TO_LOCAL,
    true,
  );
  const localArticles = getAllLocalArticles();

  if (mode === "local") {
    return localArticles;
  }

  try {
    const cmsArticles = await fetchMicroCmsArticles();
    return cmsArticles.length > 0 || mode === "microcms" ? cmsArticles : localArticles;
  } catch (error) {
    if (fallbackToLocal) {
      console.warn("[articles] microCMS fetch failed, fallback to local:", error);
      return localArticles;
    }
    throw error;
  }
});

export async function getAllArticles(): Promise<Article[]> {
  return getAllArticlesInternal();
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  return (await getAllArticles()).find((a) => a.slug === slug);
}

export async function getArticlesByCategory(
  categorySlug: string,
): Promise<Article[]> {
  return (await getAllArticles()).filter((a) => a.category === categorySlug);
}

export async function getArticlesByTag(tagSlug: string): Promise<Article[]> {
  return (await getAllArticles()).filter((a) => a.tags.includes(tagSlug));
}

export async function getRecentArticles(n: number): Promise<Article[]> {
  return (await getAllArticles()).slice(0, n);
}

/** 全記事からユニークなタグ slug（ソート済み） */
export async function getAllTagSlugs(): Promise<string[]> {
  const set = new Set<string>();
  for (const a of await getAllArticles()) {
    for (const t of a.tags) set.add(t);
  }
  return Array.from(set).sort((x, y) => x.localeCompare(y, "ja"));
}
