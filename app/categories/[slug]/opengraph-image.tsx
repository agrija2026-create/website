import {
  CATEGORY_SLUGS,
  getCategoryName,
  isValidCategorySlug,
} from "@/lib/categories";
import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "カテゴリ別の記事一覧 — 農業情報メディア";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = isValidCategorySlug(slug)
    ? getCategoryName(slug)
    : "農業情報メディア";
  return renderOgCard({ title: name, chip: "カテゴリ", photoKey: slug });
}
