import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import {
  getArticlesByTag,
  getAllTagUrlParams,
  toArticleCardData,
} from "@/lib/articles";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildAudiencePageDescription,
  getDefaultOgImage,
  getDefaultOgImageUrl,
} from "@/lib/site";
import { decodeTagFromUrl, getTagLabel, isAudienceTag } from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getAllTagUrlParams()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonicalTag = decodeTagFromUrl(slug);
  const articles = await getArticlesByTag(canonicalTag);
  if (articles.length === 0) {
    return { title: "タグが見つかりません" };
  }
  const label = getTagLabel(canonicalTag);
  const isAudiencePage = isAudienceTag(canonicalTag);
  const title = isAudiencePage ? `${label}の記事一覧` : `タグ：${label}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description = isAudiencePage
    ? buildAudiencePageDescription(label)
    : `タグ「${label}」に関連する記事一覧です。`;
  const url = absoluteUrl(`/tags/${slug}`);
  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: { canonical: url },
    robots: {
      index: isAudiencePage,
      follow: true,
    },
    openGraph: {
      type: "website",
      url,
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: getDefaultOgImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [getDefaultOgImageUrl()],
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const canonicalTag = decodeTagFromUrl(slug);
  const articles = await getArticlesByTag(canonicalTag);
  if (articles.length === 0) notFound();

  const label = getTagLabel(canonicalTag);
  const isAudiencePage = isAudienceTag(canonicalTag);
  const intro = isAudiencePage
    ? buildAudiencePageDescription(label)
    : `タグ「${label}」に関連する記事を一覧で確認できます。`;

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>
          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            {isAudiencePage ? label : `タグ：${label}`}
          </h1>
          <p className="mt-2 text-stone-600">{intro}</p>
          <p className="mt-2 text-sm text-stone-500">{articles.length}件の記事</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={toArticleCardData(article)} />
            ))}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
