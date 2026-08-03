"use client";

import { useEffect, useRef } from "react";
import { X_PROFILE_URL, SITE_X_HANDLE } from "@/lib/site";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  /** 表示中の記事slug（GAイベントの粒度） */
  slug: string;
  /** 記事の性質に合わせた見出し（省略時は汎用文） */
  heading?: string;
  /** 見出しの下の補足（省略時は汎用文） */
  body?: string;
  /** 計測用の文脈ラベル（rice / general など） */
  variant?: string;
};

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function XIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.54l-5.12-6.69L5.24 22H2l7.61-8.7L1.25 2h6.71l4.63 6.1L18.244 2zm-1.15 18h1.8L6.98 3.9H5.04L17.093 20z" />
    </svg>
  );
}

/** サイドバーなどに置く小さいフォローリンク。クリックだけ計測する。 */
export function XFollowButton({ placement }: { placement: string }) {
  return (
    <a
      href={X_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Xの公式アカウント ${SITE_X_HANDLE}`}
      onClick={() => sendGaEvent("x_follow_click", { cta_variant: placement })}
      className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
    >
      <XIcon className="h-4 w-4 fill-current" />
      <span>{SITE_X_HANDLE}</span>
    </a>
  );
}

/**
 * 記事本文の直後に置く X フォロー導線。
 * 「続報が出たら X で知らせる」という約束で、検索で来た一度きりの読者を
 * 直接流入のチャネルへ移す。メール・LINE と違い購読基盤を持たずに済む。
 */
export function XFollowCta({ slug, heading, body, variant = "general" }: Props) {
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
            sendGaEvent("x_follow_impression", {
              article_slug: slug,
              cta_variant: variant,
            });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slug, variant]);

  return (
    <div
      ref={ref}
      className="no-print mt-8 rounded-xl border border-stone-200 bg-stone-50/80 p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900">
            {heading ?? "この分野の続報は X でお知らせします"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
            {body ??
              "農林水産省の新しい発表や、締切・金額の変更があったときに投稿しています。見逃したくない方はフォローしてください。"}
          </p>
        </div>
        <a
          href={X_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Xの公式アカウント ${SITE_X_HANDLE} をフォローする`}
          onClick={() =>
            sendGaEvent("x_follow_click", {
              article_slug: slug,
              cta_variant: variant,
            })
          }
          className="inline-flex flex-none items-center justify-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
        >
          <XIcon className="h-4 w-4 fill-current" />
          <span>{SITE_X_HANDLE} をフォロー</span>
        </a>
      </div>
    </div>
  );
}
