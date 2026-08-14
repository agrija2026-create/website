"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** どこに置いたCTAか。表示率とクリック率を置き場所ごとに比べるためGAに送る */
export type SubsidyFinderCtaPlacement = "article-mid" | "article-end" | "tag" | "home";

type Props = {
  /** GAの粒度。記事slug／タグのラベル／"home" */
  context: string;
  placement: SubsidyFinderCtaPlacement;
  /** 収録している制度の数 */
  programCount: number;
  /** 診断ツールへのリンク。既定は条件を選んでいない状態 */
  href?: string;
  /** 先に選ばれる「やりたいこと」の表示名 */
  purposeLabel?: string;
  /** 先に選ばれる「品目」の表示名 */
  cropLabel?: string;
};

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/**
 * 補助金かんたん診断への導線。
 *
 * 制度を1つ読み終えた読者は「自分にはほかに何が使えるのか」を知りたいので、
 * その制度の目的を選んだ状態で診断へ送り、条件の違う候補に回遊させる。
 * 記事末（article-end）だけでは記事PVの15〜37%にしか表示されなかったため、
 * 本文の中ほど（article-mid）とタグ一覧・トップにも置く。
 */
export function SubsidyFinderCta({
  context,
  placement,
  programCount,
  href = "/tools/subsidy-finder",
  purposeLabel,
  cropLabel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const impressionSent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressionSent.current) {
            impressionSent.current = true;
            sendGaEvent("subsidy_finder_cta_impression", {
              article_slug: context,
              placement,
            });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [context, placement]);

  const isArticle = placement === "article-mid" || placement === "article-end";
  const heading = isArticle
    ? "ほかに使える制度がないか調べる"
    : "自分が使える補助金・制度資金を調べる";
  const preselected = purposeLabel ?? cropLabel;

  return (
    <div
      ref={ref}
      // 本文の中に置くので、読み上げ（ArticleTextToSpeech）は本文だけを読むよう除外する
      data-tts-ignore="true"
      className="no-print my-8 rounded-xl border border-orange-200 bg-orange-50/70 p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900">{heading}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
            立場・やりたいこと・品目の3つを選ぶと、{programCount}制度から候補が出ます。
            {preselected ? `「${preselected}」を選んだ状態で開きます。` : null}
          </p>
        </div>
        <Link
          href={href}
          prefetch={false}
          onClick={() =>
            sendGaEvent("subsidy_finder_cta_click", {
              article_slug: context,
              placement,
            })
          }
          className="inline-flex flex-none items-center justify-center gap-2 rounded-md bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-800"
        >
          補助金かんたん診断を開く
        </Link>
      </div>
    </div>
  );
}
