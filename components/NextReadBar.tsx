"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  /** 表示中の記事slug（×で閉じた状態をセッション保存するキー） */
  currentSlug: string;
  /** サジェストする1本 */
  article: { slug: string; title: string };
};

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/**
 * スクロール終盤に現れる「次に読む」固定バー（1本サジェスト）。
 * スマホは画面下のフルバー、PC（lg以上）は右下のカードとして表示する。
 * 関連記事ブロック付近まで来たら自重して退避し、×で当該記事のセッション中は非表示にする。
 */
export function NextReadBar({ currentSlug, article }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const impressionSent = useRef(false);
  const storageKey = `next-read-dismissed:${currentSlug}`;

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(storageKey)) setDismissed(true);
    } catch {
      // sessionStorage が使えなくても動作は継続する
    }
  }, [storageKey]);

  useEffect(() => {
    if (dismissed) {
      setVisible(false);
      return;
    }
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      const full = doc.scrollHeight;
      const ratio = full > 0 ? scrolled / full : 0;
      // 下部（関連記事ブロック付近）に到達したら重複を避けて退避する
      const nearBottom = scrolled >= full - 700;
      setVisible(ratio > 0.6 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [dismissed]);

  useEffect(() => {
    if (visible && !impressionSent.current) {
      impressionSent.current = true;
      sendGaEvent("next_read_impression", { article_slug: article.slug });
    }
  }, [visible, article.slug]);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    sendGaEvent("next_read_dismiss", { article_slug: article.slug });
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // 保存できなくてもイベント送信済みなので続行
    }
  };

  return (
    <div
      aria-hidden={!visible}
      className={`no-print fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-transform duration-300 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px] lg:px-0 lg:pb-0 ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-[140%]"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-orange-200 bg-white p-3 shadow-lg lg:max-w-none lg:rounded-2xl">
        <Link
          href={`/articles/${article.slug}`}
          onClick={() =>
            sendGaEvent("next_read_click", { article_slug: article.slug })
          }
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/articles/${article.slug}/opengraph-image`}
            alt=""
            width={1200}
            height={630}
            loading="lazy"
            className="h-11 w-20 flex-none rounded-md border border-stone-100 object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-700">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-3 w-3 fill-current"
              >
                <path d="M10.5 3.5 16 9l-5.5 5.5-1.4-1.4 3.1-3.1H4V8h8.2L9.1 4.9z" />
              </svg>
              次に読む
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-stone-900">
              {article.title}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="次に読むを閉じる"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-4 w-4 fill-current"
          >
            <path d="M10 8.6 5.4 4 4 5.4 8.6 10 4 14.6 5.4 16 10 11.4 14.6 16 16 14.6 11.4 10 16 5.4 14.6 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
