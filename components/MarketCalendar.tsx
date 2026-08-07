"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  MarketCalendarData,
  MarketCalendarEntry,
} from "@/lib/marketCalendar";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  data: MarketCalendarData;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

/** 選択した組み合わせのキー。`marketId::sectionId` */
function keyOf(entry: Pick<MarketCalendarEntry, "marketId" | "sectionId">) {
  return `${entry.marketId}::${entry.sectionId}`;
}

function isoOf(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatJa(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日（${weekday}）`;
}

export function MarketCalendar({ data }: Props) {
  const [selected, setSelected] = useState<string[]>([
    "toyosu::suisan",
    "ota::seika",
  ]);

  const entryMap = useMemo(() => {
    const map = new Map<string, MarketCalendarEntry>();
    for (const entry of data.entries) map.set(keyOf(entry), entry);
    return map;
  }, [data.entries]);

  const selectedEntries = useMemo(
    () =>
      selected
        .map((key) => entryMap.get(key))
        .filter((entry): entry is MarketCalendarEntry => Boolean(entry)),
    [selected, entryMap],
  );

  /** 日付 → その日に休んでいる組み合わせのラベル */
  const closedByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of selectedEntries) {
      const label = `${entry.marketName}（${entry.sectionName}）`;
      for (const day of entry.closedDays) {
        const list = map.get(day);
        if (list) list.push(label);
        else map.set(day, [label]);
      }
    }
    return map;
  }, [selectedEntries]);

  /** 一部だけが休む日＝発注を間違えやすい日 */
  const partialDays = useMemo(() => {
    if (selectedEntries.length < 2) return [];
    const out: { date: string; closed: string[]; open: string[] }[] = [];
    for (const [date, closed] of closedByDate) {
      if (closed.length === selectedEntries.length) continue;
      const open = selectedEntries
        .map((e) => `${e.marketName}（${e.sectionName}）`)
        .filter((label) => !closed.includes(label));
      out.push({ date, closed: [...closed], open });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [closedByDate, selectedEntries]);

  const toggle = useCallback((key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const downloadIcs = useCallback(() => {
    if (selectedEntries.length === 0) return;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//agri-ja.net//market-calendar//JA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:卸売市場の休市日（${data.year}年）`,
    ];
    const sortedDates = [...closedByDate.keys()].sort();
    for (const date of sortedDates) {
      const labels = closedByDate.get(date) ?? [];
      const compact = date.replace(/-/g, "");
      const [y, m, d] = date.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      const nextCompact = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${compact}-${labels.length}@agri-ja.net`,
        `DTSTART;VALUE=DATE:${compact}`,
        `DTEND;VALUE=DATE:${nextCompact}`,
        `SUMMARY:休市 ${labels.join("・")}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-closed-days-${data.year}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    window.gtag?.("event", "market_calendar_export", {
      selected_count: selectedEntries.length,
    });
  }, [closedByDate, selectedEntries, data.year]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900">
          1. 仕入れる市場と部門を選ぶ
        </h2>
        <p className="text-xs leading-relaxed text-stone-600">
          同じ市場でも部門ごとに休みが違うため、部門単位で選びます。複数を選ぶと、休みが重なる日と一方だけが休む日を分けて表示します。
        </p>
        <div className="space-y-3">
          {data.markets.map((market) => (
            <div
              key={market.id}
              className="rounded-lg border border-stone-200 bg-stone-50/60 p-3"
            >
              <p className="text-sm font-semibold text-stone-900">
                {market.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {market.sections.map((sectionId) => {
                  const key = `${market.id}::${sectionId}`;
                  const section = data.sections.find((s) => s.id === sectionId);
                  const active = selected.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-orange-600 bg-orange-600 font-semibold text-white"
                          : "border-stone-300 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {section?.name ?? sectionId}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs text-stone-500 underline hover:text-orange-800"
          >
            選択をすべて解除する
          </button>
        ) : null}
      </section>

      {selectedEntries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
          市場と部門を1つ以上選んでください。
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">
              2. 選んだ組み合わせの休市日
            </h2>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
              <span className="text-sm text-stone-700">
                選択中：
                <strong className="ml-1 text-stone-900">
                  {selectedEntries
                    .map((e) => `${e.marketName}（${e.sectionName}）`)
                    .join("、")}
                </strong>
              </span>
              <button
                type="button"
                onClick={downloadIcs}
                className="ml-auto rounded-md border border-orange-600 bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                カレンダーに取り込む（.ics）
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-stone-400" />
                選んだすべてが休み
              </span>
              {selectedEntries.length >= 2 ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-orange-400" />
                  一部だけが休み（発注に注意）
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MONTH_LABELS.map((monthLabel, monthIndex) => {
                const month = monthIndex + 1;
                const first = new Date(data.year, monthIndex, 1);
                const daysInMonth = new Date(
                  data.year,
                  month,
                  0,
                ).getDate();
                const leading = first.getDay();
                const cells: (number | null)[] = [
                  ...Array.from({ length: leading }, () => null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ];
                return (
                  <div
                    key={monthLabel}
                    className="rounded-lg border border-stone-200 bg-white p-3"
                  >
                    <p className="mb-2 text-sm font-bold text-stone-900">
                      {monthLabel}
                    </p>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
                      {WEEKDAY_LABELS.map((w) => (
                        <span key={w} className="py-1 text-stone-500">
                          {w}
                        </span>
                      ))}
                      {cells.map((day, i) => {
                        if (day === null)
                          return <span key={`empty-${i}`} className="py-1" />;
                        const iso = isoOf(data.year, month, day);
                        const closed = closedByDate.get(iso);
                        const all =
                          closed && closed.length === selectedEntries.length;
                        const partial =
                          closed && closed.length < selectedEntries.length;
                        return (
                          <span
                            key={iso}
                            title={
                              closed
                                ? `${formatJa(iso)} 休み：${closed.join("・")}`
                                : `${formatJa(iso)} 開市`
                            }
                            className={`rounded-sm py-1 ${
                              all
                                ? "bg-stone-400 font-semibold text-white"
                                : partial
                                  ? "bg-orange-400 font-semibold text-white"
                                  : "text-stone-700"
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {selectedEntries.length >= 2 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-stone-900">
                3. 一方だけが休む日
              </h2>
              {partialDays.length === 0 ? (
                <p className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                  選んだ組み合わせでは、休みが食い違う日はありません。
                </p>
              ) : (
                <>
                  <p className="text-xs leading-relaxed text-stone-600">
                    片方は開いていて、もう片方は閉まっている日です。同じ日に両方へ発注する場合はここを外さないようにしてください。
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[36rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-stone-300 bg-stone-50 text-left">
                          <th className="px-3 py-2 font-semibold text-stone-700">
                            日付
                          </th>
                          <th className="px-3 py-2 font-semibold text-stone-700">
                            休み
                          </th>
                          <th className="px-3 py-2 font-semibold text-stone-700">
                            開市
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {partialDays.map((row) => (
                          <tr
                            key={row.date}
                            className="border-b border-stone-200 align-top"
                          >
                            <td className="whitespace-nowrap px-3 py-2 text-stone-900">
                              {formatJa(row.date)}
                            </td>
                            <td className="px-3 py-2 text-stone-700">
                              {row.closed.join("、")}
                            </td>
                            <td className="px-3 py-2 text-stone-700">
                              {row.open.join("、")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-stone-900">
              {selectedEntries.length >= 2 ? "4." : "3."} 部門ごとの休市日数
            </h2>
            <ul className="space-y-1 text-sm text-stone-700">
              {selectedEntries.map((entry) => (
                <li key={keyOf(entry)}>
                  {entry.marketName}（{entry.sectionName}）：休み
                  <strong className="mx-1 text-stone-900">
                    {entry.closedDays.length}日
                  </strong>
                  ／開市
                  <strong className="mx-1 text-stone-900">
                    {(data.year % 4 === 0 ? 366 : 365) -
                      entry.closedDays.length}
                    日
                  </strong>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
