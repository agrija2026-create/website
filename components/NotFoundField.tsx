"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import Link from "next/link";

type Category = { slug: string; name: string };

type Props = {
  /** サーバー側で生成済みの最新記事カード（lib/articles の fs 依存をクライアントに持ち込まないための受け渡し） */
  cards: ReactNode[];
  categories: Category[];
};

type CrowState = "perched" | "flying";

// 各カラスの定位置（％）と、追い払われたときの飛び方（方向＋キリモミ回転）
const CROW_SLOTS = [
  { left: "12%", top: "34%", flyX: "-280px", spin: "-400deg", delay: "0s" },
  { left: "76%", top: "28%", flyX: "280px", spin: "380deg", delay: "0.5s" },
  { left: "22%", top: "16%", flyX: "-220px", spin: "-320deg", delay: "0.9s" },
  { left: "64%", top: "48%", flyX: "240px", spin: "340deg", delay: "0.3s" },
  { left: "86%", top: "44%", flyX: "300px", spin: "440deg", delay: "0.7s" },
] as const;

// 追い払うときのかかしの掛け声（ランダム）
const SCARE_QUIPS = [
  "コラーッ！",
  "しっ、しっ！",
  "あっち行けー！",
  "ここはわしの畑じゃ！",
  "二度と来るなよ〜！",
  "わしを誰だと思っとる！",
];

// 逃げるカラスの悲鳴
const CROW_CRIES = ["ギャーッ", "カァッ!?", "わー！", "退散〜！", "む、無念…"];

// クリア時の藁ふぶき（バラまく方向・色・回転）
const CONFETTI = [
  { x: "-72px", y: "-44px", r: "150deg", color: "#d9a441", delay: "0s" },
  { x: "70px", y: "-52px", r: "-170deg", color: "#ea580c", delay: "0.04s" },
  { x: "-44px", y: "-74px", r: "210deg", color: "#84a24a", delay: "0.08s" },
  { x: "48px", y: "-68px", r: "-130deg", color: "#d9a441", delay: "0.02s" },
  { x: "-92px", y: "-12px", r: "95deg", color: "#fbbf24", delay: "0.06s" },
  { x: "94px", y: "-18px", r: "-95deg", color: "#84a24a", delay: "0.1s" },
  { x: "0px", y: "-90px", r: "185deg", color: "#ea580c", delay: "0.12s" },
  { x: "-22px", y: "-82px", r: "-205deg", color: "#fbbf24", delay: "0.05s" },
  { x: "26px", y: "-84px", r: "165deg", color: "#d9a441", delay: "0.09s" },
];

export default function NotFoundField({ cards, categories }: Props) {
  const crowCount = CROW_SLOTS.length;

  const [mounted, setMounted] = useState(false);
  const [crows, setCrows] = useState<CrowState[]>(() =>
    Array.from({ length: crowCount }, () => "perched"),
  );
  const [reacting, setReacting] = useState(false); // つついた瞬間の身震い＋羽ばたき
  const [quip, setQuip] = useState<string | null>(null);

  const sceneRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const reactTimer = useRef<number | null>(null);
  const quipTimer = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(
    () => () => {
      if (reactTimer.current) window.clearTimeout(reactTimer.current);
      if (quipTimer.current) window.clearTimeout(quipTimer.current);
    },
    [],
  );

  const scaredCount = crows.filter((c) => c === "flying").length;
  const cleared = scaredCount >= crowCount;
  const showHint = mounted && scaredCount === 0;

  const scare = useCallback(() => {
    setCrows((prev) => {
      const idx = prev.findIndex((c) => c === "perched");
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = "flying";
      return next;
    });
    setReacting(true);
    setQuip(SCARE_QUIPS[Math.floor(Math.random() * SCARE_QUIPS.length)]);
    if (reactTimer.current) window.clearTimeout(reactTimer.current);
    if (quipTimer.current) window.clearTimeout(quipTimer.current);
    reactTimer.current = window.setTimeout(() => setReacting(false), 650);
    quipTimer.current = window.setTimeout(() => setQuip(null), 1300);
  }, []);

  const reset = useCallback(() => {
    setCrows(Array.from({ length: crowCount }, () => "perched"));
    setQuip(null);
  }, [crowCount]);

  // かかしの瞳がカーソルを追う（再レンダリングを避けて ref に直接適用）
  const handlePointer = useCallback((e: React.MouseEvent) => {
    const scene = sceneRef.current;
    const pupils = pupilsRef.current;
    if (!scene || !pupils) return;
    const rect = scene.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const px = Math.max(-1, Math.min(1, dx)) * 2.4;
    const py = Math.max(-1, Math.min(1, dy)) * 1.8;
    pupils.style.transform = `translate(${px}px, ${py}px)`;
  }, []);

  return (
    <section className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        {/* === 見出し === */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-orange-700/80">
            404 NOT FOUND
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-snug text-stone-900 md:text-4xl">
            この畑に、お探しの記事は実りませんでした
          </h1>
        </div>

        {/* === 畑のシーン（遊び場） === */}
        <div
          ref={sceneRef}
          onMouseMove={handlePointer}
          className="relative mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-sky-100 via-amber-50 to-lime-100 shadow-lg"
        >
          {/* 太陽 */}
          <div
            className="absolute right-6 top-6 h-14 w-14 rounded-full bg-amber-200/70 blur-[1px] md:h-20 md:w-20"
            aria-hidden
          />

          {/* シーン本体 */}
          <div className="relative h-[340px] md:h-[420px]">
            {/* つつくよう促すヒント（空の上部・かかしや記事に被らない位置） */}
            {showHint && (
              <div
                className="nf-hint absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-stone-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-md md:top-5 md:text-sm"
                aria-hidden
              >
                かかしをつついてカラスを追い払おう
                <span>👇</span>
              </div>
            )}

            {/* かかし（クリックでカラスを追い払う・記事とは無関係の遊び） */}
            <div className="absolute bottom-[64px] left-1/2 -translate-x-1/2 md:bottom-[78px]">
              {/* 掛け声の吹き出し */}
              {quip && (
                <div
                  className="nf-quip absolute -top-7 left-1/2 z-40 whitespace-nowrap rounded-2xl bg-orange-600 px-3 py-1 text-sm font-extrabold text-white shadow-lg"
                  aria-hidden
                >
                  {quip}
                  <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-orange-600" />
                </div>
              )}

              <button
                type="button"
                onClick={scare}
                disabled={mounted && cleared}
                aria-label={
                  cleared
                    ? "畑はきれいになりました。カラスはもういません"
                    : "かかしを動かしてカラスを追い払う"
                }
                className="group block cursor-pointer rounded-2xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-orange-400/60 disabled:cursor-default"
              >
                <div className={mounted ? "nf-sway" : ""}>
                  <div className={reacting ? "nf-shake" : ""}>
                    <Scarecrow
                      flapping={reacting}
                      celebrate={mounted && cleared}
                      pupilsRef={pupilsRef}
                    />
                  </div>
                </div>
              </button>

              {/* クリア時の藁ふぶき */}
              {mounted && cleared && (
                <div
                  className="pointer-events-none absolute left-1/2 top-[30%] z-30 -translate-x-1/2"
                  aria-hidden
                >
                  {CONFETTI.map((c, i) => (
                    <span
                      key={i}
                      className="nf-confetti absolute block h-2 w-2 rounded-[1px]"
                      style={
                        {
                          backgroundColor: c.color,
                          "--nf-cx": c.x,
                          "--nf-cy": c.y,
                          "--nf-cr": c.r,
                          animationDelay: c.delay,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* カラス（マウント後のみ） */}
            {mounted &&
              CROW_SLOTS.map((slot, i) => {
                const flying = crows[i] === "flying";
                return (
                  <div
                    key={i}
                    className="pointer-events-none absolute z-10"
                    style={{ left: slot.left, top: slot.top }}
                  >
                    <div
                      className={flying ? "nf-crow-fly" : "nf-bob"}
                      style={
                        flying
                          ? ({
                              "--nf-fly-x": slot.flyX,
                              "--nf-fly-spin": slot.spin,
                            } as CSSProperties)
                          : ({ animationDelay: slot.delay } as CSSProperties)
                      }
                    >
                      {flying && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-stone-700 shadow-sm">
                          {CROW_CRIES[i % CROW_CRIES.length]}
                        </span>
                      )}
                      <Crow />
                    </div>
                  </div>
                );
              })}

            {/* 地面＋麦 */}
            <Ground />
          </div>
        </div>

        {/* === 遊びのキャプション / カウンター === */}
        <div className="mt-6 text-center">
          {mounted && !cleared && (
            <p className="text-sm leading-relaxed text-stone-600 md:text-base">
              畑のカラスはイタズラ好き。
              <span className="font-semibold text-orange-700">かかしをクリック</span>
              して、ぜんぶ追い払ってみてください。
            </p>
          )}
          <p
            aria-live="polite"
            className="mt-2 min-h-[1.5rem] text-sm font-semibold text-stone-700"
          >
            {cleared
              ? "ふっ……今日も畑は、わしが守った。😎"
              : mounted && scaredCount > 0
                ? `カラスを ${scaredCount} 羽 撃退！残り ${crowCount - scaredCount} 羽…`
                : ""}
          </p>
          {mounted && cleared && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
            >
              また来た…！（もう一度）
            </button>
          )}
        </div>

        {/* === 最新の記事（常時表示） === */}
        {cards.length > 0 && (
          <div className="mt-8">
            <h2 className="border-l-4 border-orange-600 pl-3 text-lg font-bold text-stone-900">
              最新の記事
            </h2>
            <div className="mt-5 grid gap-5">
              {cards.map((card, i) => (
                <div key={i}>{card}</div>
              ))}
            </div>
          </div>
        )}

        {/* === 畑（カテゴリ）から探す === */}
        {categories.length > 0 && (
          <div className="mt-10">
            <h2 className="border-l-4 border-orange-600 pl-3 text-lg font-bold text-stone-900">
              畑（カテゴリ）から探す
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="relative rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-3 text-center text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                >
                  <span
                    className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 -translate-y-2 bg-amber-300"
                    aria-hidden
                  />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* === 主要ナビ === */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
          >
            トップへ戻る
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
          >
            記事を検索する
          </Link>
          <Link
            href="/recent"
            className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
          >
            新着記事を見る
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============ 装飾 SVG ============ */

function Scarecrow({
  flapping,
  celebrate,
  pupilsRef,
}: {
  flapping: boolean;
  celebrate: boolean;
  pupilsRef: RefObject<SVGGElement | null>;
}) {
  return (
    <svg
      viewBox="0 0 200 250"
      className="h-[230px] w-auto md:h-[290px]"
      role="img"
      aria-label="麦わら帽子をかぶった畑のかかし"
    >
      {/* 十字の支柱（木） */}
      <rect x="93" y="58" width="14" height="184" rx="3" fill="#8a5a2b" />
      <rect x="34" y="96" width="132" height="12" rx="5" fill="#9b6630" />

      {/* シャツ（本体） */}
      <path d="M80,104 L120,104 L132,178 Q100,190 68,178 Z" fill="#ea580c" />
      <path d="M93,106 L96,184" stroke="#c2410c" strokeWidth="3" opacity="0.5" />
      <path d="M107,106 L104,184" stroke="#c2410c" strokeWidth="3" opacity="0.5" />
      <path d="M73,142 L127,142" stroke="#fdba74" strokeWidth="3" opacity="0.7" />

      {/* 腕（藁の手）— 追い払うときに揺れる */}
      <g className={`nf-arms${flapping ? " nf-flap" : ""}`}>
        <path d="M86,108 L40,103 L40,117 L88,121 Z" fill="#ea580c" />
        <path d="M114,108 L160,103 L160,117 L112,121 Z" fill="#ea580c" />
        <rect x="34" y="102" width="9" height="16" rx="2" fill="#c2410c" />
        <rect x="157" y="102" width="9" height="16" rx="2" fill="#c2410c" />
        <g stroke="#d9a441" strokeWidth="3" strokeLinecap="round">
          <path d="M36,110 L22,98" />
          <path d="M36,110 L20,110" />
          <path d="M36,110 L24,122" />
          <path d="M164,110 L178,98" />
          <path d="M164,110 L180,110" />
          <path d="M164,110 L176,122" />
        </g>
      </g>

      {/* 首元の藁 */}
      <g stroke="#d9a441" strokeWidth="3" strokeLinecap="round">
        <path d="M100,98 L92,108" />
        <path d="M100,98 L100,110" />
        <path d="M100,98 L108,108" />
      </g>

      {/* ぶら下がった「404」の立て札 */}
      <line x1="89" y1="104" x2="85" y2="150" stroke="#7a5a2a" strokeWidth="2" />
      <line x1="111" y1="104" x2="115" y2="150" stroke="#7a5a2a" strokeWidth="2" />
      <rect
        x="70"
        y="150"
        width="60"
        height="30"
        rx="4"
        fill="#c9a06a"
        stroke="#a07a45"
        strokeWidth="2"
      />
      <text x="100" y="172" textAnchor="middle" fontSize="18" fontWeight="700" fill="#5b3f1e">
        404
      </text>

      {/* 頭（麻袋） */}
      <circle cx="100" cy="64" r="27" fill="#e7d3a1" stroke="#d3ba80" strokeWidth="1.5" />
      {/* 当て布パッチ */}
      <rect
        x="77"
        y="62"
        width="10"
        height="10"
        rx="1.5"
        fill="#d8c089"
        stroke="#b59d6a"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* ほっぺ */}
      <circle cx="84" cy="71" r="6" fill="#ea580c" opacity="0.16" />
      <circle cx="116" cy="71" r="6" fill="#ea580c" opacity="0.16" />
      {/* 目（白目＋追従する瞳） */}
      <circle cx="91" cy="61" r="6" fill="#fdfaf3" stroke="#b59d6a" strokeWidth="1.2" />
      <circle cx="109" cy="61" r="6" fill="#fdfaf3" stroke="#b59d6a" strokeWidth="1.2" />
      <g ref={pupilsRef} style={{ transition: "transform 0.12s ease-out" }}>
        <circle cx="91" cy="62" r="2.7" fill="#1c1917" />
        <circle cx="109" cy="62" r="2.7" fill="#1c1917" />
      </g>
      {/* 縫い目の口 */}
      <path
        d="M88,77 Q100,86 112,77"
        fill="none"
        stroke="#7a5a2a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g stroke="#7a5a2a" strokeWidth="1.5" strokeLinecap="round">
        <path d="M93,79 L93,83" />
        <path d="M100,82 L100,86" />
        <path d="M107,79 L107,83" />
      </g>

      {/* クリア時のドヤ顔サングラス */}
      {celebrate && (
        <g className="nf-shades">
          <rect x="79" y="55" width="19" height="11" rx="3" fill="#1c1917" />
          <rect x="102" y="55" width="19" height="11" rx="3" fill="#1c1917" />
          <rect x="97" y="58" width="6" height="3" rx="1" fill="#1c1917" />
          <path d="M79,57 L70,53" stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M121,57 L130,53" stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="82" y="57" width="6" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
          <rect x="105" y="57" width="6" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
        </g>
      )}

      {/* 麦わら帽子 */}
      <ellipse cx="100" cy="44" rx="42" ry="10" fill="#d9b777" stroke="#c9a665" strokeWidth="1.5" />
      <path d="M74,44 Q80,16 100,14 Q120,16 126,44 Z" fill="#e3c78a" />
      <path d="M76,40 Q100,49 124,40 L122,47 Q100,55 78,47 Z" fill="#ea580c" />

      {/* 足元の藁 */}
      <g stroke="#d9a441" strokeWidth="3" strokeLinecap="round">
        <path d="M100,238 L88,250" />
        <path d="M100,238 L100,252" />
        <path d="M100,238 L112,250" />
      </g>
    </svg>
  );
}

function Crow() {
  return (
    <svg
      viewBox="0 0 60 50"
      className="h-9 w-auto md:h-11"
      role="img"
      aria-label="畑のカラス"
    >
      {/* 体 */}
      <ellipse cx="34" cy="30" rx="22" ry="14" fill="#27272a" />
      {/* 尾 */}
      <path d="M54,26 L62,22 L56,34 Z" fill="#18181b" />
      {/* 翼 */}
      <path d="M24,22 Q36,10 48,24 Q36,30 24,22 Z" fill="#3f3f46" />
      {/* 頭 */}
      <circle cx="16" cy="24" r="11" fill="#27272a" />
      {/* くちばし */}
      <path d="M6,24 L-6,28 L7,30 Z" fill="#f59e0b" transform="translate(6 0)" />
      {/* 目 */}
      <circle cx="14" cy="22" r="2.6" fill="#fdfaf3" />
      <circle cx="14.5" cy="22" r="1.3" fill="#0a0a0a" />
    </svg>
  );
}

function Ground() {
  // 麦の高さのばらつき
  const wheat = ["44px", "56px", "38px", "60px", "48px", "52px", "40px", "58px", "46px"];
  return (
    <div className="absolute inset-x-0 bottom-0" aria-hidden>
      {/* 土と草地 */}
      <svg viewBox="0 0 400 96" preserveAspectRatio="none" className="h-[96px] w-full">
        <path d="M0,44 Q100,24 200,38 T400,34 L400,96 L0,96 Z" fill="#a3b86a" />
        <path d="M0,58 Q120,44 240,56 T400,52 L400,96 L0,96 Z" fill="#b98a4e" />
        <path d="M0,72 Q140,62 260,70 T400,66 L400,96 L0,96 Z" fill="#9c6f3a" />
      </svg>
      {/* 麦 */}
      <div className="absolute inset-x-0 bottom-[40px] flex items-end justify-between px-3 md:px-8">
        {wheat.map((h, i) => (
          <div
            key={i}
            className="nf-wheat"
            style={{ height: h, animationDelay: `${i * 0.28}s` }}
          >
            <Wheat />
          </div>
        ))}
      </div>
    </div>
  );
}

function Wheat() {
  return (
    <svg viewBox="0 0 18 70" className="h-full w-auto" aria-hidden>
      {/* 茎 */}
      <path d="M9,70 L9,26" stroke="#7a8b3f" strokeWidth="2.2" strokeLinecap="round" />
      {/* 葉 */}
      <path d="M9,52 Q2,46 3,38" stroke="#8aa055" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M9,46 Q16,40 15,32" stroke="#8aa055" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 穂 */}
      <g fill="#d9a441">
        <ellipse cx="9" cy="20" rx="3.4" ry="6" />
        <ellipse cx="5" cy="24" rx="2.6" ry="5" transform="rotate(-22 5 24)" />
        <ellipse cx="13" cy="24" rx="2.6" ry="5" transform="rotate(22 13 24)" />
        <ellipse cx="6" cy="16" rx="2.4" ry="4.5" transform="rotate(-22 6 16)" />
        <ellipse cx="12" cy="16" rx="2.4" ry="4.5" transform="rotate(22 12 16)" />
      </g>
      {/* のげ */}
      <g stroke="#e3c06a" strokeWidth="1" strokeLinecap="round">
        <path d="M9,14 L9,6" />
        <path d="M9,14 L5,7" />
        <path d="M9,14 L13,7" />
      </g>
    </svg>
  );
}
