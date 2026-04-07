import fs from "fs";
import path from "path";
import matter from "gray-matter";

const articlesDirectory = path.join(process.cwd(), "content/articles");

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  category: string;
  tags: string[];
};

export type Article = ArticleMeta & {
  htmlBody: string;
};

function readArticleFiles(): string[] {
  if (!fs.existsSync(articlesDirectory)) return [];
  return fs
    .readdirSync(articlesDirectory)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => path.join(articlesDirectory, f));
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

  return {
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    description: String(d.description ?? ""),
    publishedAt: String(d.publishedAt ?? ""),
    category: String(d.category ?? ""),
    tags,
    htmlBody: content.trim(),
  };
}

function sortByDateDesc(a: Article, b: Article): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAllArticles(): Article[] {
  return readArticleFiles()
    .map(parseArticleFile)
    .filter((a) => a.slug && a.title)
    .sort(sortByDateDesc);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return getAllArticles().filter((a) => a.category === categorySlug);
}

export function getArticlesByTag(tagSlug: string): Article[] {
  return getAllArticles().filter((a) => a.tags.includes(tagSlug));
}

export function getRecentArticles(n: number): Article[] {
  return getAllArticles().slice(0, n);
}

/** 全記事からユニークなタグ slug（ソート済み） */
export function getAllTagSlugs(): string[] {
  const set = new Set<string>();
  for (const a of getAllArticles()) {
    for (const t of a.tags) set.add(t);
  }
  return Array.from(set).sort((x, y) => x.localeCompare(y, "ja"));
}
