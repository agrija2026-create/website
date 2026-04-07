import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: "記事が見つかりません" };
  }
  return {
    title: article.title,
    description: article.description,
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
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
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
      </header>
      <div
        className="article-body mt-10"
        dangerouslySetInnerHTML={{ __html: article.htmlBody }}
      />
    </div>
  );
}
