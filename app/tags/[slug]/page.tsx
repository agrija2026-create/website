import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ListPageStructuredData } from "@/components/ListPageStructuredData";
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
  buildThemeTagPageDescription,
} from "@/lib/site";
import {
  decodeTagFromUrl,
  getTagLabel,
  getThemeTagSeoHead,
  isAudienceTag,
  isThemeTag,
} from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

// テーマタグの一覧ページは、束ねる記事がこの本数以上あるときだけ
// インデックス解放する（薄い一覧ページを検索結果に出さないため）。
const MIN_INDEXABLE_THEME_TAG_ARTICLES = 3;

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
  const shouldIndex =
    isAudiencePage ||
    (isThemeTag(canonicalTag) &&
      articles.length >= MIN_INDEXABLE_THEME_TAG_ARTICLES);
  const themeHead = getThemeTagSeoHead(canonicalTag);
  const title = isAudiencePage
    ? `${label}の農業情報まとめ｜補助金・制度の解説`
    : `${themeHead}｜解説記事まとめ`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description = isAudiencePage
    ? buildAudiencePageDescription(label)
    : buildThemeTagPageDescription(themeHead);
  const url = absoluteUrl(`/tags/${slug}`);
  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: { canonical: url },
    robots: {
      index: shouldIndex,
      follow: true,
    },
    openGraph: {
      type: "website",
      url,
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
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
  const themeHead = getThemeTagSeoHead(canonicalTag);
  const heading = isAudiencePage ? `${label}の農業情報` : themeHead;
  const intro = isAudiencePage
    ? buildAudiencePageDescription(label)
    : buildThemeTagPageDescription(themeHead);
  // 一覧ページの構造化データは、index 解放するページ（generateMetadata と同条件）のみ出力する。
  const shouldIndex =
    isAudiencePage ||
    (isThemeTag(canonicalTag) &&
      articles.length >= MIN_INDEXABLE_THEME_TAG_ARTICLES);
  const url = absoluteUrl(`/tags/${slug}`);

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          {shouldIndex ? (
            <ListPageStructuredData
              name={`${heading}｜解説記事まとめ`}
              description={intro}
              url={url}
              breadcrumbs={[
                { name: "トップ", url: absoluteUrl("/") },
                { name: heading, url },
              ]}
              items={articles.map((a) => ({ title: a.title, slug: a.slug }))}
            />
          ) : null}
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>
          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            {heading}
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
