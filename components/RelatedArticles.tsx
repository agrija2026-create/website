import Link from "next/link";
import type { Article } from "@/lib/articles";

type Props = {
  articles: Article[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RelatedArticles({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-14 border-t border-stone-200 pt-10"
    >
      <h2 id="related-heading" className="text-lg font-bold text-stone-900">
        関連記事
      </h2>
      <p className="mt-1 text-sm text-stone-500">同じカテゴリを優先して表示しています。</p>
      <ul className="mt-6 space-y-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/articles/${a.slug}`}
              className="group block rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/40"
            >
              <time
                dateTime={a.publishedAt}
                className="text-xs text-stone-500"
              >
                {formatDate(a.publishedAt)}
              </time>
              <span className="mt-1 block font-semibold text-stone-900 group-hover:text-orange-900 group-hover:underline">
                {a.title}
              </span>
              {a.description ? (
                <span className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {a.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
