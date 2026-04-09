import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesByTag, getAllTagSlugs } from "@/lib/articles";
import { getTagLabel } from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getAllTagSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articles = await getArticlesByTag(slug);
  if (articles.length === 0) {
    return { title: "タグが見つかりません" };
  }
  const label = getTagLabel(slug);
  return {
    title: `タグ：${label}`,
    description: `タグ「${label}」の記事一覧です。`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const articles = await getArticlesByTag(slug);
  if (articles.length === 0) notFound();

  const label = getTagLabel(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-orange-800 hover:underline">
          トップ
        </Link>
      </nav>
      <h1 className="mt-6 text-3xl font-bold text-stone-900">
        タグ：{label}
      </h1>
      <p className="mt-2 text-stone-600">{articles.length}件の記事</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
