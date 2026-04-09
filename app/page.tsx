import { Hero } from "@/components/Hero";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { getAllArticles } from "@/lib/articles";
import { CATEGORY_SLUGS, getCategoryName } from "@/lib/categories";

const RECENT_COUNT = 6;
const PER_CATEGORY_PREVIEW = 4;

export default async function HomePage() {
  const allArticles = await getAllArticles();
  const recent = allArticles.slice(0, RECENT_COUNT);

  return (
    <>
      <Hero />
      <div className="relative z-10 -mt-12 px-4 pb-16 md:-mt-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
            <main className="min-w-0 flex-1 space-y-12 rounded-xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
              <section aria-labelledby="recent-heading">
                <h2
                  id="recent-heading"
                  className="border-l-4 border-orange-600 pl-3 text-xl font-bold text-stone-900"
                >
                  新着記事
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-1">
                  {recent.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              </section>

              <section aria-labelledby="by-category-heading" className="space-y-10">
                <h2
                  id="by-category-heading"
                  className="border-l-4 border-orange-600 pl-3 text-xl font-bold text-stone-900"
                >
                  カテゴリ別
                </h2>
                {CATEGORY_SLUGS.map((slug) => {
                  const inCategory = allArticles.filter((a) => a.category === slug).slice(
                    0,
                    PER_CATEGORY_PREVIEW,
                  );
                  if (inCategory.length === 0) return null;
                  return (
                    <div key={slug}>
                      <h3 className="text-lg font-semibold text-stone-800">
                        {getCategoryName(slug)}
                      </h3>
                      <div className="mt-4 grid gap-4">
                        {inCategory.map((article) => (
                          <ArticleCard key={article.slug} article={article} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            </main>
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
}
