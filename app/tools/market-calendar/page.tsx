import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MarketCalendar } from "@/components/MarketCalendar";
import { getMarketCalendarData } from "@/lib/marketCalendar";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildAlternates,
} from "@/lib/site";

const PAGE_PATH = "/tools/market-calendar";
const TITLE = "卸売市場の休市日カレンダー｜市場と部門を選んで発注日を確認する";
const DESCRIPTION =
  "東京都中央卸売市場の休市日を、市場と部門を選ぶだけでまとめて確認できます。青果と水産で休みが食い違う日も一覧で出せて、カレンダーアプリに取り込める.icsも書き出せます。";

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

export default function MarketCalendarPage() {
  const data = getMarketCalendarData();

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
              卸売市場の休市日カレンダー
            </h1>
            <p className="text-sm leading-relaxed text-stone-700">
              仕入れる市場と部門を選ぶと、{data.year}年の休市日をまとめたカレンダーが出ます。青果と水産のように休みが食い違う日は色を分けて表示するので、発注カレンダーを組むときの取りこぼしを防げます。
            </p>
            <p className="text-xs leading-relaxed text-stone-500">
              収録は{data.openerName}の11市場・
              {data.entries.length}
              通りです。データは都が公表するカレンダーによります（{data.checkedAt}
              確認）。休市日は毎年決め直されるため、
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener"
                className="text-orange-800 underline hover:text-orange-900"
              >
                東京都中央卸売市場の開場日・休業日カレンダー
              </a>
              で最新の情報もあわせてご確認ください。
            </p>
          </div>

          <MarketCalendar data={data} />

          <section className="space-y-3 border-t border-stone-200 pt-6">
            <h2 className="text-lg font-bold text-stone-900">
              休市日の決まり方を知りたいとき
            </h2>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/articles/wholesale-market-closed-days"
                  className="block rounded-lg border border-stone-200 bg-stone-50/70 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50/60"
                >
                  <span className="block text-sm font-semibold text-stone-900">
                    卸売市場の休市日の読み方｜水曜休市が毎週でない理由と、青果と鮮魚で違う休み
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone-600">
                    水曜休市が毎週ではない理由、部門で休みがずれる法的な理由、年末年始の止め市と初市の違いを解説しています。他の主要市場のカレンダーへのリンクもこちらにあります。
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/articles/baisanken-market-buyer-approval"
                  className="block rounded-lg border border-stone-200 bg-stone-50/70 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50/60"
                >
                  <span className="block text-sm font-semibold text-stone-900">
                    買参権の取り方｜卸売市場で直接仕入れる売買参加者になる要件・申請先・費用
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone-600">
                    卸売業者から直接仕入れるために必要な資格の取り方を、要件・申請先・費用の順に整理しています。
                  </span>
                </Link>
              </li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200 pt-6">
            <h2 className="text-base font-bold text-stone-900">
              データについて
            </h2>
            <ul className="space-y-1.5 text-xs leading-relaxed text-stone-600">
              {data.notes.map((note) => (
                <li key={note}>・{note}</li>
              ))}
            </ul>
          </section>
        </main>

        <Sidebar />
      </div>
    </div>
  );
}
