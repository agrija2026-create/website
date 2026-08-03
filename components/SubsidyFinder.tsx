"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FinderOption, SubsidyProgram } from "@/lib/subsidyFinder";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  programs: SubsidyProgram[];
  audienceOptions: FinderOption[];
  purposeOptions: FinderOption[];
  cropOptions: FinderOption[];
};

type Answers = {
  audience: string | null;
  purpose: string | null;
  crop: string | null;
};

const EMPTY: Answers = { audience: null, purpose: null, crop: null };

function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/** 条件を共有できるよう #立場-目的-品目 の形でURLに持たせる */
function parseHash(hash: string, valid: Record<keyof Answers, Set<string>>): Answers {
  const parts = hash.replace(/^#/, "").split("/");
  const pick = (v: string | undefined, key: keyof Answers) =>
    v && valid[key].has(v) ? v : null;
  return {
    audience: pick(parts[0], "audience"),
    purpose: pick(parts[1], "purpose"),
    crop: pick(parts[2], "crop"),
  };
}

function matches(program: SubsidyProgram, answers: Answers): boolean {
  if (answers.audience && !program.audiences.includes(answers.audience)) return false;
  if (answers.purpose && !program.purposes.includes(answers.purpose)) return false;
  if (
    answers.crop &&
    !program.crops.includes("any") &&
    !program.crops.includes(answers.crop)
  ) {
    return false;
  }
  return true;
}

function Question({
  step,
  title,
  options,
  selected,
  onSelect,
}: {
  step: number;
  title: string;
  options: FinderOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
      <legend className="px-1 text-sm font-bold text-stone-900">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
          {step}
        </span>
        {title}
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.id)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                active
                  ? "border-orange-500 bg-orange-50 text-orange-900"
                  : "border-stone-200 bg-white text-stone-800 hover:border-orange-300 hover:bg-orange-50/60"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-xs text-stone-500">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SubsidyFinder({
  programs,
  audienceOptions,
  purposeOptions,
  cropOptions,
}: Props) {
  const valid = useMemo(
    () => ({
      audience: new Set(audienceOptions.map((o) => o.id)),
      purpose: new Set(purposeOptions.map((o) => o.id)),
      crop: new Set(cropOptions.map((o) => o.id)),
    }),
    [audienceOptions, purposeOptions, cropOptions],
  );

  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const startSent = useRef(false);

  // 共有されたURLの条件を復元する
  useEffect(() => {
    if (window.location.hash) {
      setAnswers(parseHash(window.location.hash, valid));
    }
  }, [valid]);

  // 選んだ条件を共有できるようURLに残す。
  // replaceState は Router を更新するので、実際にURLが変わるときだけ呼ぶ。
  useEffect(() => {
    const hash = [answers.audience, answers.purpose, answers.crop]
      .map((v) => v ?? "")
      .join("/")
      .replace(/\/+$/, "");
    const next = hash ? `#${hash}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.hash}`;
    if (next === window.location.hash || next === current) return;
    window.history.replaceState(null, "", next);
  }, [answers]);

  const update = useCallback((key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
    if (!startSent.current) {
      startSent.current = true;
      sendGaEvent("subsidy_finder_start");
    }
    sendGaEvent("subsidy_finder_answer", { question: key, answer: value });
  }, []);

  const answered = [answers.audience, answers.purpose, answers.crop].filter(Boolean).length;
  const results = useMemo(
    () => (answered === 0 ? [] : programs.filter((p) => matches(p, answers))),
    [answered, answers, programs],
  );

  // 結果件数は条件が変わるたびに送る（0件の組み合わせを見つけるため）
  useEffect(() => {
    if (answered === 0) return;
    sendGaEvent("subsidy_finder_result", {
      result_count: results.length,
      audience: answers.audience ?? "",
      purpose: answers.purpose ?? "",
      crop: answers.crop ?? "",
    });
  }, [answered, answers, results.length]);

  const reset = () => setAnswers(EMPTY);

  return (
    <div className="space-y-4">
      <Question
        step={1}
        title="いまの立場に近いものは？"
        options={audienceOptions}
        selected={answers.audience}
        onSelect={(id) => update("audience", id)}
      />
      <Question
        step={2}
        title="やりたいことは？"
        options={purposeOptions}
        selected={answers.purpose}
        onSelect={(id) => update("purpose", id)}
      />
      <Question
        step={3}
        title="主な品目は？"
        options={cropOptions}
        selected={answers.crop}
        onSelect={(id) => update("crop", id)}
      />

      <div className="scroll-mt-20">
        {answered === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
            上の3つから選ぶと、条件に合う制度がここに出ます。1つだけ選んで幅広く見ることもできます。
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-stone-900">
                条件に合う制度 {results.length}件
                {answered < 3 ? (
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    （残り{3 - answered}問に答えると絞り込めます）
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-xs text-stone-500 underline underline-offset-2 hover:text-orange-800"
              >
                選び直す
              </button>
            </div>

            {results.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
                <p>
                  この組み合わせに当てはまる制度は、まだこのサイトに解説記事がありません。品目を「その他・複合」に変えるか、条件をひとつ外して探してみてください。
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((program) => (
                  <li
                    key={program.slug}
                    className="rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-orange-300"
                  >
                    <Link
                      href={`/articles/${program.slug}`}
                      onClick={() =>
                        sendGaEvent("subsidy_finder_article_click", {
                          article_slug: program.slug,
                        })
                      }
                      className="block"
                    >
                      <p className="text-base font-bold text-stone-900 underline-offset-2 hover:text-orange-900 hover:underline">
                        {program.title}
                      </p>
                      <p className="mt-1.5 inline-block rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-900">
                        {program.keyPoint}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">
                        {program.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
