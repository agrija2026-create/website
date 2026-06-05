import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "農業情報メディアの記事";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getAllArticles()).map((a) => ({ slug: a.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const title = article?.title ?? "農業情報メディア";
  const category = article?.category ?? "";
  return renderOgCard({
    title,
    chip: category ? getCategoryName(category) : null,
    photoKey: category,
  });
}
