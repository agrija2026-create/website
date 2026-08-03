import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { SubsidyFinder } from "@/components/SubsidyFinder";
import {
  AUDIENCE_OPTIONS,
  CROP_OPTIONS,
  PURPOSE_OPTIONS,
  getSubsidyFinderData,
} from "@/lib/subsidyFinder";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildAlternates,
} from "@/lib/site";

const PAGE_PATH = "/tools/subsidy-finder";
const TITLE = "農業の補助金かんたん診断｜立場・目的・品目から使える制度を探す";
const DESCRIPTION =
  "3つの質問に答えるだけで、いまの立場とやりたいことに合う農業の補助金・交付金・制度資金を探せます。補助率や上限額の目安つきで、それぞれの解説記事にそのまま進めます。";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_NAME}` },
  description: DESCRIPTION,
  alternates: buildAlternates(absoluteUrl(PAGE_PATH)),
  openGraph: {
    type: "website",
    url: absoluteUrl(PAGE_PATH),
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function SubsidyFinderPage() {
  const { programs, alwaysShow } = await getSubsidyFinderData();

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
              農業の補助金かんたん診断
            </h1>
            <p className="text-sm leading-relaxed text-stone-700">
              立場・やりたいこと・品目の3つを選ぶと、当てはまる補助金や交付金、制度資金の候補が出ます。収録は{programs.length}制度で、それぞれ補助率や上限額の目安と解説記事へのリンクが付きます。
            </p>
            <p className="text-xs leading-relaxed text-stone-500">
              1つだけ選んで幅広く見ることもできます。表示される金額は各制度の代表的な目安で、実際の要件・単価・公募時期は最新の公募要領と、市町村・都道府県・JAの窓口で必ず確認してください。
            </p>
          </div>

          <SubsidyFinder
            programs={programs}
            audienceOptions={AUDIENCE_OPTIONS}
            purposeOptions={PURPOSE_OPTIONS}
            cropOptions={CROP_OPTIONS}
          />

          {alwaysShow.length > 0 ? (
            <section className="space-y-3 border-t border-stone-200 pt-6">
              <h2 className="text-lg font-bold text-stone-900">
                どの制度を使うにも先に読んでおきたい記事
              </h2>
              <ul className="space-y-3">
                {alwaysShow.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="block rounded-lg border border-stone-200 bg-stone-50/70 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50/60"
                    >
                      <span className="block text-sm font-semibold text-stone-900">
                        {article.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-stone-600">
                        {article.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
