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
  /** 「次に読む」動線として手動指定する関連記事slug（最優先・記載順を維持） */
  relatedSlugs?: string[];
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

  const relatedSlugsRaw = d.relatedSlugs;
  const relatedSlugs = Array.isArray(relatedSlugsRaw)
    ? relatedSlugsRaw.map(String).map((s) => s.trim()).filter(Boolean)
    : typeof relatedSlugsRaw === "string" && relatedSlugsRaw.trim()
      ? [relatedSlugsRaw.trim()]
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
    relatedSlugs,
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

  const relatedSlugsRaw = item.relatedSlugs;
  const relatedSlugs = Array.isArray(relatedSlugsRaw)
    ? relatedSlugsRaw.map(String).map((s) => s.trim()).filter(Boolean)
    : typeof relatedSlugsRaw === "string" && relatedSlugsRaw.trim()
      ? [relatedSlugsRaw.trim()]
      : undefined;

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
    relatedSlugs,
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

/**
 * ③ の関連度スコアの重み。テーマタグ一致を最優先、同カテゴリを次点、読者タグ一致は補助。
 * 読者タグ（生産者向け等）は「生産者向け」が大半の記事に付き識別力が弱いため軽めにする。
 */
const RELATED_WEIGHT = {
  theme: 3,
  category: 2,
  audience: 1,
} as const;

/**
 * 「次に読む」動線用の関連記事を返す。
 * ① frontmatter の relatedSlugs（手動指定・最優先・記載順）→ ② クラスター定義 →
 * ③ 関連度スコア（テーマタグ一致×3＋同カテゴリ×2＋読者タグ一致×1・同点は公開日降順）→
 * ④ 同カテゴリ→他カテゴリの新着、の順で limit まで補充する。
 */
export async function getRelatedArticles(
  slug: string,
  category: string,
  limit = 3,
): Promise<RelatedArticlesResult> {
  const all = await getAllArticles();
  const bySlug = new Map(all.map((a) => [a.slug, a]));
  const self = bySlug.get(slug);

  const out: Article[] = [];
  const seen = new Set<string>([slug]);
  const add = (article: Article | undefined): boolean => {
    if (!article || seen.has(article.slug)) return false;
    out.push(article);
    seen.add(article.slug);
    return true;
  };

  // ① frontmatter で手動指定した「次に読む」動線（最優先・記載順を維持）
  for (const s of self?.relatedSlugs ?? []) {
    if (out.length >= limit) break;
    add(bySlug.get(s));
  }
  const manualUsed = out.length > 0;

  // ② クラスター定義
  let clusterUsed = false;
  const cluster = getArticleCluster(slug);
  if (cluster) {
    for (const memberSlug of cluster) {
      if (out.length >= limit) break;
      if (add(bySlug.get(memberSlug))) clusterUsed = true;
    }
  }

  // ③ 関連度スコアで補充。テーマタグの一致だけでなく「同カテゴリ」「読者タグの一致」
  //    も重み付けして合算する（読者=対象が違う記事が広いテーマタグ1個で紛れ込むのを防ぐ）。
  //    公開日は同点時のタイブレークのみに使い、新着だけが浮上しないようにする。
  let themeUsed = false;
  if (out.length < limit && self) {
    const selfThemeSet = new Set(self.tags.filter(isThemeTag));
    const selfAudienceSet = new Set(self.tags.filter(isAudienceTag));
    const scored = all
      .filter((a) => !seen.has(a.slug))
      .map((a) => {
        const sharedTheme = a.tags.filter((t) => selfThemeSet.has(t)).length;
        const sharedAudience = a.tags.filter((t) =>
          selfAudienceSet.has(t),
        ).length;
        const sameCategory = a.category === self.category ? 1 : 0;
        const score =
          RELATED_WEIGHT.theme * sharedTheme +
          RELATED_WEIGHT.category * sameCategory +
          RELATED_WEIGHT.audience * sharedAudience;
        return { article: a, score };
      })
      .filter((x) => x.score > 0)
      .sort(
        (x, y) => y.score - x.score || sortByDateDesc(x.article, y.article),
      );
    for (const x of scored) {
      if (out.length >= limit) break;
      if (add(x.article)) themeUsed = true;
    }
  }

  // ④ 同カテゴリ→他カテゴリの新着で不足分を補う
  if (out.length < limit) {
    for (const a of all) {
      if (out.length >= limit) break;
      if (a.category === category) add(a);
    }
    for (const a of all) {
      if (out.length >= limit) break;
      add(a);
    }
  }

  const source: RelatedArticlesSource =
    clusterUsed || manualUsed ? "cluster" : themeUsed ? "theme" : "category";
  return { articles: out.slice(0, limit), source };
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
