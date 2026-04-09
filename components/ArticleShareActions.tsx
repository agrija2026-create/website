"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  url: string;
  title: string;
};

export function ArticleShareActions({ url, title }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const announce = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 3500);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      announce("リンクをコピーしました");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        announce("リンクをコピーしました");
      } catch {
        announce("コピーに失敗しました");
      }
    }
  }, [announce, url]);

  const shareNative = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: title, url });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
  }, [title, url]);

  const printPage = useCallback(() => {
    window.print();
  }, []);

  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  return (
    <div className="article-share-actions no-print mt-6 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-6">
      <span className="mr-1 text-sm font-semibold text-stone-600">共有・印刷</span>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
      >
        URLをコピー
      </button>
      <a
        href={lineShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-green-400 hover:bg-green-50"
      >
        LINEで送る
      </a>
      {canNativeShare ? (
        <button
          type="button"
          onClick={shareNative}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
        >
          共有…
        </button>
      ) : null}
      <button
        type="button"
        onClick={printPage}
        className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
      >
        印刷
      </button>
      <p ref={statusRef} className="sr-only" role="status" aria-live="polite">
        {status ?? ""}
      </p>
    </div>
  );
}
