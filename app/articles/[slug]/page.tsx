import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleStructuredData } from "@/components/ArticleStructuredData";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import { absoluteUrl, toIsoDateTime } from "@/lib/site";
import { getTagLabel, partitionTags } from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getAllArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "記事が見つかりません" };
  }
  const url = absoluteUrl(`/articles/${slug}`);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      publishedTime: toIsoDateTime(article.publishedAt),
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const { audience, other } = partitionTags(article.tags);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <ArticleStructuredData article={article} slug={slug} />
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-orange-800 hover:underline">
          トップ
        </Link>
      </nav>
      <header className="mt-6 border-b border-stone-200 pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          <span aria-hidden>·</span>
          <Link
            href={`/categories/${article.category}`}
            className="font-medium text-orange-800 hover:underline"
          >
            {getCategoryName(article.category)}
          </Link>
        </div>
        {audience.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-stone-600">対象読者</span>
            {audience.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
        {other.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-stone-600">タグ</span>
            {other.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 hover:border-orange-200 hover:bg-orange-50/80"
              >
                {getTagLabel(t)}
              </Link>
            ))}
          </div>
        )}
      </header>
      <div
        className="article-body mt-10"
        dangerouslySetInnerHTML={{ __html: article.htmlBody }}
      />
    </div>
  );
}
