import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import { enrichArticleHtml } from "@/lib/articleHtml";
import type { TocItem } from "@/lib/articleHtml";
import { extractSourceUrlsFromHtml, mergeSourceUrls } from "@/lib/articleSources";
import { sanitizeTrustedHtml } from "@/lib/sanitizeHtml";
import { getArticleCluster } from "@/lib/articleClusters";
import {
  buildSidebarThemeTags,
  encodeTagForUrl,
  getTagLabel,
  isAudienceTag,
  isThemeTag,
  stripCategoryOverlapThemeTags,
  validateArticleAudienceTags,
  validateArticleThemeTags,
} from "@/lib/tags";

const articlesDirectory = path.join(process.cwd(), "content/articles");
const sourceHtmlDirectoryPrefix = "content/source-html/";

type DataSource = "local" | "microcms" | "auto";

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  /** 更新日（任意）。未指定時は publishedAt を dateModified に使用 */
  updatedAt?: string;
  category: string;
  tags: string[];
  /** JSON-LD about / keywords 用（テーマタグのみ、カテゴリ重複除外済み） */
  themeTags: string[];
  /** JSON-LD isBasedOn 用（出典 URL。HTML の source ブロックから自動抽出 + frontmatter 追加分） */
  sourceUrls: string[];
  /** 冒頭「この記事でわかること」用（任意） */
  takeaways: string[];
  /** 読了目安（分）。未指定時は本文から自動算出 */
  readingMinutes?: number;
  sourceHtmlFile?: string;
};

export type Article = ArticleMeta & {
  htmlBody: string;
  toc: TocItem[];
};

export type ArticleCardData = Pick<
  ArticleMeta,
  "title" | "slug" | "description" | "publishedAt" | "category" | "tags"
>;

export type RelatedArticleData = Pick<
  ArticleMeta,
  "title" | "slug" | "description" | "publishedAt"
>;

export function toArticleCardData(article: ArticleMeta): ArticleCardData {
  return {
    title: article.title,
    slug: article.slug,
    description: article.description,
    publishedAt: article.publishedAt,
    category: article.category,
    tags: article.tags,
  };
}

export function toRelatedArticleData(article: ArticleMeta): RelatedArticleData {
  return {
    title: article.title,
    slug: article.slug,
    description: article.description,
    publishedAt: article.publishedAt,
  };
}

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

  const takeawaysRaw = d.takeaways;
  const takeaways = Array.isArray(takeawaysRaw)
    ? takeawaysRaw.map(String).filter(Boolean)
    : typeof takeawaysRaw === "string" && takeawaysRaw.trim()
      ? [takeawaysRaw.trim()]
      : [];

  const readingMinutesRaw = d.readingMinutes;
  const readingMinutesParsed =
    typeof readingMinutesRaw === "number"
      ? readingMinutesRaw
      : typeof readingMinutesRaw === "string" && readingMinutesRaw.trim()
        ? Number(readingMinutesRaw)
        : NaN;
  const readingMinutes = Number.isFinite(readingMinutesParsed)
    ? Math.max(1, Math.min(180, Math.round(readingMinutesParsed)))
    : undefined;

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

  const category = String(d.category ?? "");
  validateArticleAudienceTags(tags, path.basename(filePath));
  validateArticleThemeTags(tags, path.basename(filePath));

  const sanitized = sanitizeTrustedHtml(htmlBody);
  const { html: enrichedHtml, toc } = enrichArticleHtml(sanitized);

  const sourceUrlsRaw = d.sourceUrls;
  const sourceUrlsFromFrontmatter = Array.isArray(sourceUrlsRaw)
    ? sourceUrlsRaw.map(String)
    : typeof sourceUrlsRaw === "string" && sourceUrlsRaw.trim()
      ? [sourceUrlsRaw.trim()]
      : undefined;

  const updatedAtRaw = d.updatedAt;
  const updatedAt =
    typeof updatedAtRaw === "string" && updatedAtRaw.trim()
      ? updatedAtRaw.trim()
      : undefined;

  const themeTags = stripCategoryOverlapThemeTags(
    tags.filter((t) => !isAudienceTag(t) && isThemeTag(t)),
    category,
  );
  const sourceUrls = mergeSourceUrls(
    sourceUrlsFromFrontmatter,
    extractSourceUrlsFromHtml(enrichedHtml),
  );

  return {
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    description: String(d.description ?? ""),
    publishedAt: String(d.publishedAt ?? ""),
    updatedAt,
    category,
    tags,
    themeTags,
    sourceUrls,
    takeaways,
    readingMinutes,
    sourceHtmlFile,
    htmlBody: enrichedHtml,
    toc,
  };
}

function sortByDateDesc(a: Article, b: Article): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");
}

function splitSearchTerms(query: string): string[] {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

function buildArticleSearchText(article: Article): string {
  return normalizeSearchText([
    article.title,
    article.description,
    ...article.tags,
    ...article.tags.map(getTagLabel),
  ].join(" "));
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
  validateArticleThemeTags(tags, `microCMS:${slug}`);

  const takeawaysRaw = item.takeaways;
  const takeaways = Array.isArray(takeawaysRaw)
    ? takeawaysRaw.map(String).filter(Boolean)
    : typeof takeawaysRaw === "string" && takeawaysRaw.trim()
      ? [takeawaysRaw.trim()]
      : [];

  const sanitized = sanitizeTrustedHtml(bodyCandidate);
  const { html: enrichedHtml, toc } = enrichArticleHtml(sanitized);

  const updatedAtRaw = item.updatedAt;
  const updatedAt =
    typeof updatedAtRaw === "string" && updatedAtRaw.trim()
      ? updatedAtRaw.trim()
      : undefined;

  const sourceUrlsRaw = item.sourceUrls;
  const sourceUrlsFromFrontmatter = Array.isArray(sourceUrlsRaw)
    ? sourceUrlsRaw.map(String)
    : typeof sourceUrlsRaw === "string" && sourceUrlsRaw.trim()
      ? [sourceUrlsRaw.trim()]
      : undefined;

  const themeTags = stripCategoryOverlapThemeTags(
    tags.filter((t) => !isAudienceTag(t) && isThemeTag(t)),
    category,
  );
  const sourceUrls = mergeSourceUrls(
    sourceUrlsFromFrontmatter,
    extractSourceUrlsFromHtml(enrichedHtml),
  );

  return {
    title,
    slug,
    description,
    publishedAt,
    updatedAt,
    category,
    tags,
    themeTags,
    sourceUrls,
    takeaways,
    htmlBody: enrichedHtml,
    toc,
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

export async function searchArticles(query: string): Promise<Article[]> {
  const terms = splitSearchTerms(query);
  if (terms.length === 0) return [];

  return (await getAllArticles()).filter((article) => {
    const searchText = buildArticleSearchText(article);
    return terms.every((term) => searchText.includes(term));
  });
}

export type RelatedArticlesSource = "cluster" | "theme" | "category";

export type RelatedArticlesResult = {
  articles: Article[];
  source: RelatedArticlesSource;
};

/** クラスター定義を優先し、なければ同カテゴリ→他カテゴリの新着で埋める */
export async function getRelatedArticles(
  slug: string,
  category: string,
  limit = 3,
): Promise<RelatedArticlesResult> {
  const all = await getAllArticles();
  const bySlug = new Map(all.map((a) => [a.slug, a]));

  const cluster = getArticleCluster(slug);
  if (cluster) {
    const out: Article[] = [];
    for (const memberSlug of cluster) {
      if (memberSlug === slug) continue;
      const article = bySlug.get(memberSlug);
      if (!article) continue;
      out.push(article);
      if (out.length >= limit) {
        return { articles: out, source: "cluster" };
      }
    }
    if (out.length > 0) {
      return { articles: out, source: "cluster" };
    }
  }

  // ② 同じテーマタグを共有する記事（共有数が多い順／同数は公開日降順）。
  const self = bySlug.get(slug);
  const selfThemeTags = self ? self.tags.filter(isThemeTag) : [];
  if (selfThemeTags.length > 0) {
    const selfThemeSet = new Set(selfThemeTags);
    const scored: { article: Article; shared: number }[] = [];
    for (const a of all) {
      if (a.slug === slug) continue;
      const shared = a.tags.filter((t) => selfThemeSet.has(t)).length;
      if (shared > 0) scored.push({ article: a, shared });
    }
    if (scored.length > 0) {
      scored.sort((x, y) => y.shared - x.shared);
      return {
        articles: scored.slice(0, limit).map((s) => s.article),
        source: "theme",
      };
    }
  }

  const out: Article[] = [];
  const seen = new Set<string>();

  for (const a of all) {
    if (a.slug === slug || a.category !== category) continue;
    out.push(a);
    seen.add(a.slug);
    if (out.length >= limit) return { articles: out, source: "category" };
  }

  for (const a of all) {
    if (a.slug === slug || seen.has(a.slug)) continue;
    out.push(a);
    seen.add(a.slug);
    if (out.length >= limit) return { articles: out, source: "category" };
  }

  return { articles: out, source: "category" };
}

/** 全記事からユニークなタグ（記事データ上の文字列・ソート済み） */
export async function getAllTagSlugs(): Promise<string[]> {
  const set = new Set<string>();
  for (const a of await getAllArticles()) {
    for (const t of a.tags) set.add(t);
  }
  return Array.from(set).sort((x, y) => x.localeCompare(y, "ja"));
}

/** サイドバー「タグ一覧」用（テーマタグ・件数降順） */
export async function getSidebarThemeTags() {
  const counts = new Map<string, number>();
  for (const a of await getAllArticles()) {
    for (const t of a.tags) {
      if (!isThemeTag(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return buildSidebarThemeTags(counts);
}

/** 記事カード等：テーマタグのみ（読者タグ・カテゴリ重複除外） */
export function getVisibleThemeTags(tags: string[], category: string): string[] {
  const theme = tags.filter((t) => !isAudienceTag(t) && isThemeTag(t));
  return stripCategoryOverlapThemeTags(theme, category);
}

/** `/tags/[slug]` の generateStaticParams 用（URL セグメント・重複なし） */
export async function getAllTagUrlParams(): Promise<string[]> {
  const set = new Set<string>();
  for (const a of await getAllArticles()) {
    for (const t of a.tags) {
      set.add(encodeTagForUrl(t));
    }
  }
  return Array.from(set).sort((x, y) => x.localeCompare(y, "ja"));
}
