"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  slug: string;
};

function sendGaEvent(name: string) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name);
  }
}

export function ArticleFeedback({ slug }: Props) {
  const [answered, setAnswered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const readCompleteSent = useRef(false);
  const storageKey = `article-feedback:${slug}`;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey)) {
        setAnswered(true);
      }
    } catch {
      // localStorage が使えない環境では二重投票防止なしで動かす
    }
  }, [storageKey]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // ウィジェット上端がビューポートに入った（または通過済みの）時点で読了とみなす。
    // IntersectionObserver はジャンプスクロールで通過すると発火しないため scroll 判定にする
    const check = () => {
      if (readCompleteSent.current) return;
      if (el.getBoundingClientRect().top < window.innerHeight) {
        readCompleteSent.current = true;
        sendGaEvent("article_read_complete");
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const answer = useCallback(
    (helpful: boolean) => {
      sendGaEvent(helpful ? "article_feedback_yes" : "article_feedback_no");
      setAnswered(true);
      try {
        window.localStorage.setItem(storageKey, helpful ? "yes" : "no");
      } catch {
        // 保存できなくてもイベント送信済みなので続行
      }
    },
    [storageKey],
  );

  return (
    <div
      ref={rootRef}
      className="no-print mt-8 rounded-xl border border-stone-200 bg-stone-50/80 p-4 md:p-5"
    >
      {answered ? (
        <p className="text-sm font-medium text-stone-700" role="status" aria-live="polite">
          ご回答ありがとうございました。今後の記事づくりの参考にします。
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-stone-800">
            この記事は役に立ちましたか？
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => answer(true)}
              className="rounded-md border border-stone-200 bg-white px-4 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
            >
              はい
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded-md border border-stone-200 bg-white px-4 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
            >
              いいえ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
