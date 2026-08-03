"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Props = {
  /** 表示中の記事slug（GAイベントの粒度） */
  slug: string;
  /** 診断ツールへのリンク（その制度の目的を選んだ状態） */
  href: string;
  /** 先に選ばれる「やりたいこと」の表示名 */
  purposeLabel: string;
  /** 収録している制度の数 */
  programCount: number;
};

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/**
 * 制度マスタに載っている記事の本文直後に置く、診断ツールへの導線。
 * 1つの制度を読み終えた読者は「自分にはほかに何が使えるのか」を知りたいので、
 * その制度の目的を選んだ状態で診断へ送り、条件の違う候補に回遊させる。
 */
export function SubsidyFinderCta({ slug, href, purposeLabel, programCount }: Props) {
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
            sendGaEvent("subsidy_finder_cta_impression", { article_slug: slug });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);

  return (
    <div
      ref={ref}
      className="no-print mt-8 rounded-xl border border-orange-200 bg-orange-50/70 p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900">
            ほかに使える制度がないか調べる
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
            立場・やりたいこと・品目の3つを選ぶと、{programCount}制度から候補が出ます。
            「{purposeLabel}」を選んだ状態で開きます。
          </p>
        </div>
        <Link
          href={href}
          onClick={() => sendGaEvent("subsidy_finder_cta_click", { article_slug: slug })}
          className="inline-flex flex-none items-center justify-center gap-2 rounded-md bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-800"
        >
          補助金かんたん診断を開く
        </Link>
      </div>
    </div>
  );
}
