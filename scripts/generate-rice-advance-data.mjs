#!/usr/bin/env node
/**
 * 令和8年産 米の概算金データを、正本TSVから CSV / JSON に書き出す。
 * 引用・再利用してもらうためのオープンデータ。正本は content/data/*.tsv 側だけを編集する。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "content/data/rice-advance-payment-r8.tsv");
const OUT_CSV = path.join(ROOT, "public/data/rice-advance-payment-r8.csv");
const OUT_JSON = path.join(ROOT, "public/data/rice-advance-payment-r8.json");

const ARTICLE_PATH = "/articles/rice-advance-payment-by-region";
const DATA_PAGE_PATH = "/data/rice-advance-payment";
const LICENSE =
  "出典として「農業情報メディア（agri-ja.net）」の記載と、データページへのリンクを条件に、自由に利用・再配布できます。";
const NUMERIC_COLUMNS = new Set(["令和8年産_円", "令和7年産_円"]);

function siteOrigin() {
  const raw =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || "https://agri-ja.net";
  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return new URL(normalized).origin;
}

function escapeCsvField(value) {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function readTsv(file) {
  const lines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "");
  const header = lines[0].split("\t").map((h) => h.trim());
  const rows = lines.slice(1).map((line, i) => {
    const cells = line.split("\t");
    // タブが1つ足りないと備考が発表日の列に入り込むので、列数のずれで止める
    if (cells.length !== header.length) {
      throw new Error(
        `${i + 2} 行目: 列数が ${cells.length}（ヘッダは ${header.length}）です。空欄もタブで埋めてください`,
      );
    }
    return Object.fromEntries(
      header.map((key, j) => [key, (cells[j] ?? "").trim()]),
    );
  });
  return { header, rows };
}

/** 正本の取りこぼしはビルドで止める（列ずれに気づかないまま公開しないため） */
function validate(header, rows) {
  const required = ["産地", "銘柄", "区分", "状態", "情報区分", "令和8年産_円"];
  const missing = required.filter((key) => !header.includes(key));
  if (missing.length > 0) {
    throw new Error(`TSV に必要な列がありません: ${missing.join(", ")}`);
  }
  for (const [i, row] of rows.entries()) {
    if (!row["産地"]) {
      throw new Error(`${i + 2} 行目: 産地が空です`);
    }
    if (row["状態"] === "発表済み" && !row["令和8年産_円"]) {
      throw new Error(
        `${i + 2} 行目（${row["産地"]}）: 状態が発表済みなのに金額が空です`,
      );
    }
    // 決定（JA・全農の決定日が確認できる）と報道（報道でのみ伝わっている）を必ず区別する
    if (row["状態"] === "発表済み" && !["決定", "報道"].includes(row["情報区分"])) {
      throw new Error(
        `${i + 2} 行目（${row["産地"]}）: 情報区分は「決定」か「報道」で書いてください（現在: ${row["情報区分"] || "空"}）`,
      );
    }
    for (const col of NUMERIC_COLUMNS) {
      const v = row[col];
      if (v && !/^\d+$/.test(v)) {
        throw new Error(
          `${i + 2} 行目（${row["産地"]}）: ${col} は数字のみで書いてください（現在: ${v}）`,
        );
      }
    }
  }
}

function toJsonRow(row) {
  const num = (key) => (row[key] ? Number(row[key]) : null);
  return {
    prefecture: row["産地"],
    organization: row["決定主体"] === "—" ? null : row["決定主体"] || null,
    brand: row["銘柄"] === "—" ? null : row["銘柄"] || null,
    riceType: row["区分"],
    status: row["状態"],
    confirmation: row["情報区分"] === "—" ? null : row["情報区分"] || null,
    amountR8Yen: num("令和8年産_円"),
    amountR7Yen: num("令和7年産_円"),
    changeFromPreviousYear: row["前年産との差"] || null,
    announcedOn: row["発表日"] || null,
    note: row["備考"] || null,
  };
}

function main() {
  const origin = siteOrigin();
  const { header, rows } = readTsv(SOURCE);
  validate(header, rows);

  const csvLines = [
    header.join(","),
    ...rows.map((row) => header.map((key) => escapeCsvField(row[key])).join(",")),
  ];
  const bom = "﻿";
  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, bom + csvLines.join("\n") + "\n", "utf8");

  const announced = rows.filter((r) => r["状態"] === "発表済み");
  const updated = announced
    .map((r) => r["発表日"])
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .at(-1);

  const json = {
    name: "令和8年産（2026年産）米の概算金 産地・銘柄別データ",
    description:
      "全農県本部・経済連などが提示した令和8年産米の概算金（玄米60キロ当たり）を、産地・銘柄別に集約したデータ。未提示の産地は令和7年産の水準と見通しを収録。",
    unit: "円（玄米60キロ・1等当たり）",
    confirmationNote:
      "情報区分（confirmation）は、決定＝JA・全農が決めたことが日付まで確認できる金額（日付は決定・公表日）、報道＝報道で金額が伝わった段階でJAは金額を公表しておらず決定日も特定されていないもの（日付は報道日）。",
    updated: updated ?? null,
    rowCount: rows.length,
    announcedCount: announced.length,
    license: LICENSE,
    source: `${origin}${ARTICLE_PATH}`,
    dataPage: `${origin}${DATA_PAGE_PATH}`,
    rows: rows.map(toJsonRow),
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(json, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${rows.length} rows (${announced.length} announced) to ${path.relative(ROOT, OUT_CSV)} and ${path.relative(ROOT, OUT_JSON)}`,
  );
}

main();
