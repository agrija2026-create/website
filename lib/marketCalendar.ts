import fs from "fs";
import path from "path";
import { cache } from "react";

export type MarketSection = {
  id: string;
  name: string;
  note: string;
};

export type MarketDef = {
  id: string;
  name: string;
  /** この市場が取り扱う部門の id */
  sections: string[];
};

/** 市場 × 部門ごとの休市日 */
export type MarketCalendarEntry = {
  marketId: string;
  marketName: string;
  sectionId: string;
  sectionName: string;
  /** ISO 形式（YYYY-MM-DD）の休市日 */
  closedDays: string[];
};

export type MarketCalendarData = {
  year: number;
  openerName: string;
  sourceUrl: string;
  checkedAt: string;
  sections: MarketSection[];
  markets: MarketDef[];
  entries: MarketCalendarEntry[];
  notes: string[];
};

const DATA_PATH = path.join(
  process.cwd(),
  "content",
  "tools",
  "market-calendar.json",
);

export const getMarketCalendarData = cache((): MarketCalendarData => {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as MarketCalendarData;
});
