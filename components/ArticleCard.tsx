import Link from "next/link";
import type { ArticleCardData } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import { encodeTagForUrl, getTagLabel, partitionTags } from "@/lib/tags";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  article: ArticleCardData;
};

export function ArticleCard({ article }: Props) {
  const { audience, other } = partitionTags(article.tags);

  return (
    <article className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        <span aria-hidden>·</span>
        <Link
          href={`/categories/${article.category}`}
          className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-800 transition-colors hover:bg-orange-100"
        >
          {getCategoryName(article.category)}
        </Link>
      </div>
      {audience.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">対象読者</span>
          {audience.map((t) => (
            <Link
              key={t}
              href={`/tags/${encodeTagForUrl(t)}`}
              className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900 transition-colors hover:bg-sky-100"
            >
              {t}
            </Link>
          ))}
        </div>
      )}
      {other.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">タグ</span>
          {other.map((t) => (
            <Link
              key={t}
              href={`/tags/${encodeTagForUrl(t)}`}
              className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-700 transition-colors hover:border-orange-200 hover:bg-orange-50/80"
            >
              {getTagLabel(t)}
            </Link>
          ))}
        </div>
      )}
      <h2 className="mt-2 text-lg font-bold leading-snug text-stone-900">
        <Link
          href={`/articles/${article.slug}`}
          className="transition-colors group-hover:text-orange-800"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">
        {article.description}
      </p>
      <Link
        href={`/articles/${article.slug}`}
        className="mt-3 inline-flex text-sm font-semibold text-orange-700 underline-offset-4 hover:underline"
      >
        記事を読む
      </Link>
    </article>
  );
}
