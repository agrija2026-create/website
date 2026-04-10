import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { getAllArticles, toArticleCardData } from "@/lib/articles";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  getDefaultOgImage,
  getDefaultOgImageUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `新着記事一覧 | ${SITE_NAME}`,
  },
  description: "農業情報メディアの新着記事を日付順に一覧します。",
  alternates: { canonical: absoluteUrl("/recent") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/recent"),
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: `新着記事一覧 | ${SITE_NAME}`,
    description: "農業情報メディアの新着記事を日付順に一覧します。",
    images: getDefaultOgImage(),
  },
  twitter: {
    card: "summary_large_image",
    title: `新着記事一覧 | ${SITE_NAME}`,
    description: "農業情報メディアの新着記事を日付順に一覧します。",
    images: [getDefaultOgImageUrl()],
  },
};

export default async function RecentArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <main className="min-w-0 flex-1 space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>
          <h1 className="border-l-4 border-orange-600 pl-3 text-2xl font-bold text-stone-900">
            新着記事一覧
          </h1>
          <p className="text-sm text-stone-600">
            {articles.length}件（公開日の新しい順）
          </p>
          <div className="grid gap-5 sm:grid-cols-1">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={toArticleCardData(article)} />
            ))}
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
