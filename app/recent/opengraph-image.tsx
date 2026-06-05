import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "新着記事一覧 — 農業情報メディア";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard({ title: "新着記事一覧", chip: null, photoKey: "budget" });
}
