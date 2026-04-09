import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { getArticlesByCategory } from "@/lib/articles";
import {
  CATEGORY_SLUGS,
  getCategoryName,
  isValidCategorySlug,
} from "@/lib/categories";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidCategorySlug(slug)) {
    return { title: "カテゴリが見つかりません" };
  }
  const name = getCategoryName(slug);
  return {
    title: `${name}の記事一覧`,
    description: `カテゴリ「${name}」の記事一覧です。`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidCategorySlug(slug)) notFound();

  const articles = await getArticlesByCategory(slug);
  const name = getCategoryName(slug);

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>
          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            カテゴリ：{name}
          </h1>
          <p className="mt-2 text-stone-600">
            {articles.length}件の記事
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
          {articles.length === 0 && (
            <p className="mt-8 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
              このカテゴリの記事はまだありません。
            </p>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
