import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSearchForm } from "@/components/ArticleSearchForm";
import { Sidebar } from "@/components/Sidebar";
import { searchArticles } from "@/lib/articles";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

function normalizeQuery(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const query = normalizeQuery(params?.q);

  if (!query) {
    return {
      title: "記事検索",
      description: "農業情報メディアの記事をタイトル・概要・タグから検索できます。",
    };
  }

  return {
    title: `「${query}」の検索結果`,
    description: `「${query}」に一致する記事を表示します。`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const query = normalizeQuery(params?.q);
  const articles = query ? await searchArticles(query) : [];

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <main className="min-w-0 flex-1 space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>

          <div className="space-y-3">
            <h1 className="border-l-4 border-orange-600 pl-3 text-2xl font-bold text-stone-900">
              記事検索
            </h1>
            <p className="text-sm text-stone-600">
              タイトル・概要・タグを対象に、気になるテーマの記事を探せます。
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <ArticleSearchForm defaultValue={query} />
          </div>

          {query ? (
            <>
              <p className="text-sm text-stone-600">
                「{query}」の検索結果: {articles.length}件
              </p>
              {articles.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-1">
                  {articles.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
                  該当する記事は見つかりませんでした。別のキーワードでもお試しください。
                </p>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
              キーワードを入力して記事を検索してください。
            </p>
          )}
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
