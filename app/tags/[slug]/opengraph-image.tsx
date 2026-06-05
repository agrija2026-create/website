import { getAllTagUrlParams } from "@/lib/articles";
import { OG_SIZE, renderOgCard } from "@/lib/og-card";
import { decodeTagFromUrl, getTagLabel } from "@/lib/tags";

export const runtime = "nodejs";
export const alt = "タグ別の記事一覧 — 農業情報メディア";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getAllTagUrlParams()).map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const label = getTagLabel(decodeTagFromUrl(slug));
  return renderOgCard({ title: label, chip: "タグ", photoKey: "default" });
}
