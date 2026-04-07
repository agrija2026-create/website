import Link from "next/link";
import { CATEGORY_MAP } from "@/lib/categories";
import { getAllTagSlugs } from "@/lib/articles";
import { getTagLabel } from "@/lib/tags";

export function Sidebar() {
  const tagSlugs = getAllTagSlugs();

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-20">
        <section>
          <h2 className="text-sm font-bold text-stone-900">このサイトについて</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            農林水産の政策・予算・現場の動きを、要点を押さえてわかりやすく整理します。一次情報との照合を前提にご活用ください。
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-sm leading-relaxed text-stone-600">運営：農業の人</p>
            <a
              href="https://x.com/agri_ja"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Xの公式アカウント @agri_ja"
              className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 fill-current"
              >
                <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.54l-5.12-6.69L5.24 22H2l7.61-8.7L1.25 2h6.71l4.63 6.1L18.244 2zm-1.15 18h1.8L6.98 3.9H5.04L17.093 20z" />
              </svg>
              <span>@agri_ja</span>
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-900">タグ一覧</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tagSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/tags/${slug}`}
                  className="inline-block rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
                >
                  {getTagLabel(slug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-900">カテゴリ一覧</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(CATEGORY_MAP).map(([slug, name]) => (
              <li key={slug}>
                <Link
                  href={`/categories/${slug}`}
                  className="text-stone-700 underline-offset-2 hover:text-orange-800 hover:underline"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
