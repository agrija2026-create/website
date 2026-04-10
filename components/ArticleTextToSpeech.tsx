"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlaybackState = "idle" | "speaking" | "paused";

type Props = {
  title: string;
  takeaways: string[];
  rootSelector: string;
  className?: string;
};

function normalizeSegment(text: string): string {
  return text.replace(/\s+/g, " ").replace(/【図】/g, "図").trim();
}

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ja") && /kyoko|otoya|google/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ja")) ??
    null
  );
}

function extractArticleSegments(root: Element | null): string[] {
  if (!root) return [];

  const segments: string[] = [];
  const nodes = root.querySelectorAll("h2, h3, p, li, .note, th, td, figcaption");

  nodes.forEach((node) => {
    if (node.closest("[data-tts-ignore='true']")) return;
    const text = normalizeSegment((node as HTMLElement).innerText || node.textContent || "");
    if (!text) return;
    if (segments[segments.length - 1] === text) return;
    segments.push(text);
  });

  return segments;
}

export function ArticleTextToSpeech({ title, takeaways, rootSelector, className }: Props) {
  const [isSupported, setIsSupported] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback((message?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    sessionRef.current += 1;
    window.speechSynthesis.cancel();
    setPlaybackState("idle");
    if (message) setStatus(message);
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const handlePageHide = () => stop();

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      stop();
    };
  }, [isSupported, stop]);

  const start = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const root = document.querySelector(rootSelector);
    const bodySegments = extractArticleSegments(root);
    const introSegments = [title, ...(takeaways.length > 0 ? ["この記事でわかること", ...takeaways] : [])]
      .map(normalizeSegment)
      .filter(Boolean);
    const segments = [...introSegments, ...bodySegments];

    if (segments.length === 0) {
      setStatus("読み上げる本文を取得できませんでした");
      return;
    }

    const synth = window.speechSynthesis;
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    synth.cancel();

    const voice = pickJapaneseVoice(synth.getVoices());
    let failed = false;

    segments.forEach((segment, index) => {
      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.lang = "ja-JP";
      utterance.rate = 1;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;

      utterance.onerror = () => {
        if (sessionRef.current !== sessionId || failed) return;
        failed = true;
        setPlaybackState("idle");
        setStatus("読み上げを続けられませんでした");
      };

      utterance.onend = () => {
        if (sessionRef.current !== sessionId || failed) return;
        if (index === segments.length - 1) {
          setPlaybackState("idle");
          setStatus("読み上げが完了しました");
        }
      };

      synth.speak(utterance);
    });

    setPlaybackState("speaking");
    setStatus("読み上げを開始しました");
  }, [rootSelector, takeaways, title]);

  const togglePause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    if (playbackState === "speaking") {
      synth.pause();
      setPlaybackState("paused");
      setStatus("読み上げを一時停止しました");
      return;
    }

    if (playbackState === "paused") {
      synth.resume();
      setPlaybackState("speaking");
      setStatus("読み上げを再開しました");
    }
  }, [playbackState]);

  if (!isSupported) return null;

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {playbackState === "idle" ? (
        <button
          type="button"
          onClick={start}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
        >
          音声で聞く
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePause}
            className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
          >
            {playbackState === "paused" ? "再開" : "一時停止"}
          </button>
          <button
            type="button"
            onClick={() => stop("読み上げを停止しました")}
            className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:border-orange-300 hover:bg-orange-50"
          >
            停止
          </button>
        </>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {status ?? ""}
      </p>
    </div>
  );
}
