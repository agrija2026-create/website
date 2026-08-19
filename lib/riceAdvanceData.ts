import fs from "fs";
import path from "path";
import { cache } from "react";

export type RiceAdvanceRow = {
  prefecture: string;
  organization: string | null;
  brand: string | null;
  riceType: string;
  status: "発表済み" | "未提示" | string;
  /** 決定＝JA・全農の決定日が確認できる金額／報道＝報道でのみ伝わっている金額 */
  confirmation: "決定" | "報道" | null;
  amountR8Yen: number | null;
  amountR7Yen: number | null;
  changeFromPreviousYear: string | null;
  announcedOn: string | null;
  note: string | null;
};

export type RiceAdvanceDataset = {
  rows: RiceAdvanceRow[];
  announced: RiceAdvanceRow[];
  pending: RiceAdvanceRow[];
  /** 発表済み行のうち最も新しい発表日 */
  updatedOn: string | null;
};

const SOURCE_PATH = path.join(
  process.cwd(),
  "content/data/rice-advance-payment-r8.tsv",
);

/** 正本TSVは scripts/generate-rice-advance-data.mjs と同じものを読む（生成物には依存しない） */
export const getRiceAdvanceDataset = cache(async (): Promise<RiceAdvanceDataset> => {
  const raw = await fs.promises.readFile(SOURCE_PATH, "utf8");
  const lines = raw.split("\n").filter((line) => line.trim() !== "");
  const header = lines[0].split("\t").map((h) => h.trim());

  const rows: RiceAdvanceRow[] = lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const get = (key: string) => {
      const i = header.indexOf(key);
      return i < 0 ? "" : (cells[i] ?? "").trim();
    };
    const dash = (v: string) => (v === "" || v === "—" ? null : v);
    const num = (v: string) => (v === "" ? null : Number(v));

    return {
      prefecture: get("産地"),
      organization: dash(get("決定主体")),
      brand: dash(get("銘柄")),
      riceType: get("区分"),
      status: get("状態"),
      confirmation: dash(get("情報区分")) as RiceAdvanceRow["confirmation"],
      amountR8Yen: num(get("令和8年産_円")),
      amountR7Yen: num(get("令和7年産_円")),
      changeFromPreviousYear: dash(get("前年産との差")),
      announcedOn: dash(get("発表日")),
      note: dash(get("備考")),
    };
  });

  const announced = rows.filter((r) => r.status === "発表済み");
  const updatedOn =
    announced
      .map((r) => r.announcedOn)
      .filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .at(-1) ?? null;

  return {
    rows,
    announced,
    pending: rows.filter((r) => r.status !== "発表済み"),
    updatedOn,
  };
});

export function formatYen(value: number | null): string {
  return value === null ? "—" : `${value.toLocaleString("ja-JP")}円`;
}
