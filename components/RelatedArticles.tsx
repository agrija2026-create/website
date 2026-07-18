"use client";

import Link from "next/link";
import type {
  RelatedArticleData,
  RelatedArticlesSource,
} from "@/lib/articles";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  articles: RelatedArticleData[];
  source?: RelatedArticlesSource;
  /** 表示中（リンク元）の記事slug。related_click の from_slug に使う */
  currentSlug?: string;
};

const SOURCE_HINT: Record<RelatedArticlesSource, string> = {
  cluster: "読んだ内容の続き・関連するテーマの記事です。",
  theme: "読んだ内容に関連するテーマの記事です。",
  category: "同じカテゴリの記事です。",
};

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RelatedArticles({
  articles,
  source = "category",
  currentSlug,
}: Props) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-14 border-t border-stone-200 pt-10"
    >
      <h2 id="related-heading" className="text-lg font-bold text-stone-900">
        この続きを読む
      </h2>
      <p className="mt-1 text-sm text-stone-500">{SOURCE_HINT[source]}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {articles.map((a, i) => (
          <li key={a.slug}>
            <Link
              href={`/articles/${a.slug}`}
              onClick={() =>
                sendGaEvent("related_click", {
                  article_slug: a.slug,
                  from_slug: currentSlug,
                  position: i + 1,
                  related_source: source,
                })
              }
              className="group flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/articles/${a.slug}/opengraph-image`}
                alt=""
                width={1200}
                height={630}
                loading="lazy"
                className="h-16 w-28 flex-none rounded-md border border-stone-100 object-cover"
              />
              <span className="min-w-0 flex-1">
                <time
                  dateTime={a.publishedAt}
                  className="text-xs text-stone-500"
                >
                  {formatDate(a.publishedAt)}
                </time>
                <span className="mt-0.5 line-clamp-2 block font-semibold leading-snug text-stone-900 group-hover:text-orange-900 group-hover:underline">
                  {a.title}
                </span>
                {a.description ? (
                  <span className="mt-1 line-clamp-2 text-sm text-stone-600">
                    {a.description}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
