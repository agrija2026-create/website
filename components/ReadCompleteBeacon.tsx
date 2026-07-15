"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendGaEvent(name: string) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name);
  }
}

/**
 * 本文の末尾に置く読了ビーコン。上端がビューポートに入った（＝本文を読み切った）時点で
 * article_read_complete を送る。関連記事ブロックの位置に依存させないため、
 * ArticleFeedback から分離している。
 */
export function ReadCompleteBeacon() {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // IntersectionObserver はジャンプスクロールで通過すると発火しないため scroll 判定にする
    const check = () => {
      if (sent.current) return;
      if (el.getBoundingClientRect().top < window.innerHeight) {
        sent.current = true;
        sendGaEvent("article_read_complete");
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
