import Link from "next/link";
import { getSidebarThemeTags } from "@/lib/articles";
import { CATEGORY_MAP } from "@/lib/categories";
import type { TocItem } from "@/lib/articleHtml";
import { ArticleToc } from "@/components/ArticleToc";
import { XFollowButton } from "@/components/XFollowCta";
import {
  AUDIENCE_TAGS,
  encodeTagForUrl,
} from "@/lib/tags";

type SidebarProps = {
  tocItems?: TocItem[];
};

export async function Sidebar({ tocItems }: SidebarProps = {}) {
  const themeTags = await getSidebarThemeTags();

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-20">
        {tocItems && tocItems.length > 0 ? (
          <div className="hidden lg:block">
            <ArticleToc items={tocItems} variant="desktop" />
          </div>
        ) : null}

        <section>
          <h2 className="text-sm font-bold text-stone-900">このサイトについて</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            農林水産の政策・予算・現場の動きを、要点を押さえてわかりやすく整理します。記事の制作には一部生成AIを利用しています。一次情報との照合を前提にご活用ください。
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-sm leading-relaxed text-stone-600">運営：農業情報メディア編集部</p>
            <XFollowButton placement="sidebar" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-900">使える制度を探す</h2>
          <Link
            href="/tools/subsidy-finder"
            className="mt-3 block rounded-lg border border-orange-200 bg-orange-50/70 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50"
          >
            <span className="block text-sm font-semibold text-orange-900">
              補助金かんたん診断
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-600">
              立場・やりたいこと・品目の3つを選ぶと、使える補助金や制度資金の候補が出ます。
            </span>
          </Link>
          <Link
            href="/tools/market-calendar"
            className="mt-3 block rounded-lg border border-orange-200 bg-orange-50/70 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50"
          >
            <span className="block text-sm font-semibold text-orange-900">
              卸売市場の休市日カレンダー
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-600">
              市場と部門を選ぶと休市日がまとまります。青果と水産で休みが食い違う日もわかります。
            </span>
          </Link>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-900">読者別</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {AUDIENCE_TAGS.map((label) => (
              <li key={label}>
                <Link
                  href={`/tags/${encodeTagForUrl(label)}`}
                  className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 transition-colors hover:border-sky-300 hover:bg-sky-100"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-900">タグ一覧</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {themeTags.map(({ label }) => (
              <li key={label}>
                <Link
                  href={`/tags/${encodeTagForUrl(label)}`}
                  className="inline-block rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
                >
                  {label}
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
