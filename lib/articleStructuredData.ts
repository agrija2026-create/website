import type { ArticleMeta } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import {
  ORGANIZATION_ID,
  absoluteUrl,
  toIsoDateTime,
} from "@/lib/site";

export type ArticleStructuredDataInput = Pick<
  ArticleMeta,
  | "title"
  | "description"
  | "publishedAt"
  | "updatedAt"
  | "category"
  | "themeTags"
  | "sourceUrls"
>;

export function buildArticleJsonLd(
  article: ArticleStructuredDataInput,
  slug: string,
): Record<string, unknown> {
  const pageUrl = absoluteUrl(`/articles/${slug}`);
  const publishedIso = toIsoDateTime(article.publishedAt);
  const modifiedIso = toIsoDateTime(article.updatedAt ?? article.publishedAt);
  const categoryName = getCategoryName(article.category);

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    image: [absoluteUrl(`/articles/${slug}/opengraph-image`)],
    author: { "@type": "Organization", "@id": ORGANIZATION_ID },
    publisher: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    articleSection: categoryName,
    inLanguage: "ja",
  };

  if (article.themeTags.length > 0) {
    articleLd.keywords = article.themeTags.join("、");
    articleLd.about = article.themeTags.map((name) => ({
      "@type": "Thing",
      name,
    }));
  }

  if (article.sourceUrls.length > 0) {
    articleLd.isBasedOn = article.sourceUrls.map((url) => ({
      "@type": "CreativeWork",
      url,
    }));
  }

  return articleLd;
}

/**
 * FAQPage 構造化データ。Q&A が2件未満なら null（薄い FAQ・Google 要件回避）。
 */
export function buildArticleFaqJsonLd(
  items: { question: string; answer: string }[],
): Record<string, unknown> | null {
  if (items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * HowTo 構造化データ。ステップが2件未満なら null。
 * ※ Google は HowTo リッチリザルトを2023年に廃止済み。有効なスキーマとして出力するが表示効果は限定的。
 */
export function buildArticleHowToJsonLd(
  name: string,
  steps: string[],
): Record<string, unknown> | null {
  if (steps.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
}

export function buildArticleBreadcrumbJsonLd(
  article: Pick<ArticleStructuredDataInput, "title" | "category">,
  slug: string,
): Record<string, unknown> {
  const pageUrl = absoluteUrl(`/articles/${slug}`);
  const categoryUrl = absoluteUrl(`/categories/${article.category}`);
  const categoryName = getCategoryName(article.category);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: pageUrl,
      },
    ],
  };
}
