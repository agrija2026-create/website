import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";

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
  article: Article;
};

export function ArticleCard({ article }: Props) {
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
