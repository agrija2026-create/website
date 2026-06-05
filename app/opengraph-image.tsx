import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "農業情報メディア — 農政・補助金・制度をわかりやすく解説";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard({
    title: "農政・補助金・制度を、わかりやすく解説",
    chip: null,
    photoKey: "policy",
  });
}
