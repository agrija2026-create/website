import type { Metadata } from "next";
import Link from "next/link";
import { CopyTextButton } from "@/components/CopyTextButton";
import { Sidebar } from "@/components/Sidebar";
import {
  formatYen,
  getRiceAdvanceDataset,
  type RiceAdvanceRow,
} from "@/lib/riceAdvanceData";
import {
  ORGANIZATION_ID,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildAlternates,
} from "@/lib/site";

const PAGE_PATH = "/data/rice-advance-payment";
const ARTICLE_PATH = "/articles/rice-advance-payment-by-region";
const CSV_PATH = "/data/rice-advance-payment-r8.csv";
const JSON_PATH = "/data/rice-advance-payment-r8.json";

const TITLE = "令和8年産 米の概算金データ（CSV・JSON）｜産地・銘柄別オープンデータ";
const DESCRIPTION =
  "全農県本部・経済連が提示した令和8年産（2026年産）米の概算金を、産地・銘柄別にまとめたデータを CSV と JSON で配布します。出典明記を条件に自由に利用できます。";

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

function AmountCell({ row }: { row: RiceAdvanceRow }) {
  if (row.amountR8Yen !== null) {
    return <span className="font-semibold text-stone-900">{formatYen(row.amountR8Yen)}</span>;
  }
  return <span className="text-stone-500">未提示</span>;
}

export default async function RiceAdvancePaymentDataPage() {
  const { rows, announced, pending, updatedOn } = await getRiceAdvanceDataset();

  const creditText = `出典：農業情報メディア「令和8年産 米の概算金データ」（${absoluteUrl(PAGE_PATH)}）`;

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "令和8年産（2026年産）米の概算金 産地・銘柄別データ",
    description: DESCRIPTION,
    url: absoluteUrl(PAGE_PATH),
    inLanguage: "ja",
    keywords: ["概算金", "米価", "令和8年産", "仮渡金", "全農", "産地別"],
    ...(updatedOn ? { dateModified: updatedOn } : {}),
    creator: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isBasedOn: absoluteUrl(ARTICLE_PATH),
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: absoluteUrl(CSV_PATH),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl(JSON_PATH),
      },
    ],
  };

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <main className="min-w-0 flex-1 space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
          <nav className="text-sm text-stone-500">
            <Link prefetch={false} href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>

          <div className="space-y-3">
            <h1 className="border-l-4 border-orange-600 pl-3 text-2xl font-bold text-stone-900">
              令和8年産 米の概算金データ（CSV・JSON）
            </h1>
            <p className="text-sm leading-relaxed text-stone-700">
              全農県本部・経済連などが提示した令和8年産（2026年産）米の概算金を、産地・銘柄別に集約したデータです。玄米60キロ・1等当たりの金額で、まだ金額が示されていない産地は令和7年産の水準と現時点の見方を収録しています。
            </p>
            <p className="text-sm text-stone-600">
              収録 {rows.length} 行（発表済み {announced.length} 行・未提示 {pending.length} 行）
              {updatedOn ? ` / 最終更新 ${updatedOn}` : ""}
            </p>
          </div>

          <section className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 md:p-5">
            <h2 className="text-sm font-bold text-stone-900">ダウンロード</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={CSV_PATH}
                download
                className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
              >
                CSV をダウンロード
              </a>
              <a
                href={JSON_PATH}
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition-colors hover:border-orange-300 hover:bg-orange-50"
              >
                JSON を開く
              </a>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-600">
              CSV は Excel でそのまま開けるよう BOM 付き UTF-8 です。金額の列（令和8年産_円・令和7年産_円）は数値のみで、単位は円（玄米60キロ・1等当たり）です。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">利用条件</h2>
            <p className="text-sm leading-relaxed text-stone-700">
              出典の記載と、このページまたは
              <Link prefetch={false} href={ARTICLE_PATH} className="text-orange-800 underline underline-offset-2">
                解説記事
              </Link>
              へのリンクを条件に、報道・研究・社内資料・アプリなどで自由に利用・再配布できます。加工したデータの公開も可能です。事前の連絡は不要です。
            </p>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs font-semibold text-stone-500">クレジット表記の例</p>
              <p className="mt-1 break-all font-mono text-sm text-stone-800">{creditText}</p>
              <p className="mt-2">
                <CopyTextButton
                  text={creditText}
                  label="クレジットをコピー"
                  gaVariant="rice-advance"
                />
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">収録データ</h2>
            <div className="article-table-scroll overflow-x-auto">
              <table className="article-data-table w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-left">
                    <th className="border border-stone-200 px-3 py-2">産地</th>
                    <th className="border border-stone-200 px-3 py-2">銘柄</th>
                    <th className="border border-stone-200 px-3 py-2">区分</th>
                    <th className="border border-stone-200 px-3 py-2">令和8年産</th>
                    <th className="border border-stone-200 px-3 py-2">令和7年産</th>
                    <th className="border border-stone-200 px-3 py-2">発表日・情報区分</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${row.prefecture}-${row.brand ?? "na"}-${i}`}>
                      <td className="border border-stone-200 px-3 py-2">
                        {row.prefecture}
                        {row.organization ? (
                          <span className="block text-xs text-stone-500">{row.organization}</span>
                        ) : null}
                      </td>
                      <td className="border border-stone-200 px-3 py-2">{row.brand ?? "—"}</td>
                      <td className="border border-stone-200 px-3 py-2">{row.riceType}</td>
                      <td className="border border-stone-200 px-3 py-2">
                        <AmountCell row={row} />
                      </td>
                      <td className="border border-stone-200 px-3 py-2">
                        {formatYen(row.amountR7Yen)}
                      </td>
                      <td className="border border-stone-200 px-3 py-2">
                        {row.announcedOn ?? "—"}
                        {row.confirmation ? (
                          <span className="block text-xs text-stone-500">
                            {row.confirmation}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              情報区分の「決定」は、JA・全農が決定を自ら発表・公表した金額（日付は発表日）、「報道」は報道機関の取材で判明し、JA・全農が金額を公表していないもの（日付は金額が明らかになった日）です。「報道」もJAが決めた金額で、未決定という意味ではありません。金額は各産地の当初提示額です。同じ県内でもJAごとに上乗せや独自の奨励金が付く場合があり、等級や検査結果でも変わります。実際の手取りは出荷先のJAが示す最新の提示額で確認してください。備考と前年産との差を含む全項目は CSV・JSON に収録しています。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">出典と更新</h2>
            <p className="text-sm leading-relaxed text-stone-700">
              各全農県本部・経済連の発表と、その報道をもとに農業情報メディア編集部が集約しています。産地ごとの背景や発表時期の見通しは
              <Link prefetch={false} href={ARTICLE_PATH} className="text-orange-800 underline underline-offset-2">
                令和8年産（2026年）米の概算金｜産地・銘柄別の最新金額と発表時期
              </Link>
              で解説しています。主食用うるち米は8月下旬から9月に順次提示されるため、発表され次第このデータを更新します。
            </p>
          </section>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
