"use client";

import { useCallback, useState } from "react";

type Props = {
  /** コピーする本文 */
  text: string;
  label?: string;
  /** GAイベントの文脈ラベル（省略時は送信しない） */
  gaVariant?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** 引用クレジットなど、短いテキストをコピーさせるボタン */
export function CopyTextButton({ text, label = "コピー", gaVariant }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const copy = useCallback(async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    setStatus(ok ? "コピーしました" : "コピーに失敗しました");
    window.setTimeout(() => setStatus(null), 3000);
    if (ok && gaVariant && typeof window.gtag === "function") {
      window.gtag("event", "data_credit_copy", { cta_variant: gaVariant });
    }
  }, [gaVariant, text]);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
      >
        {label}
      </button>
      <span aria-live="polite" className="text-xs text-stone-500">
        {status}
      </span>
    </span>
  );
}
