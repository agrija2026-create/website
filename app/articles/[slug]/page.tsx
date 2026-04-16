import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBreadcrumb } from "@/components/ArticleBreadcrumb";
import { ArticleShareActions } from "@/components/ArticleShareActions";
import { ArticleStructuredData } from "@/components/ArticleStructuredData";
import { ArticleTextToSpeech } from "@/components/ArticleTextToSpeech";
import { ArticleToc } from "@/components/ArticleToc";
import { RelatedArticles } from "@/components/RelatedArticles";
import { Sidebar } from "@/components/Sidebar";
import { estimateReadingMinutesJa } from "@/lib/articleHtml";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
  toRelatedArticleData,
} from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  getDefaultOgImage,
  getDefaultOgImageUrl,
  toIsoDateTime,
} from "@/lib/site";
import { encodeTagForUrl, getTagLabel, partitionTags } from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getAllArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "記事が見つかりません" };
  }
  const url = absoluteUrl(`/articles/${slug}`);
  const title = article.title;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description = article.description;
  const publishedTime = toIsoDateTime(article.publishedAt);
  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      publishedTime,
      modifiedTime: publishedTime,
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripLeadingArticleHeader(html: string): string {
  return html.replace(/(<article[^>]*>\s*)<header[\s\S]*?<\/header>\s*/i, "$1");
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const { audience, other } = partitionTags(article.tags);
  const pageUrl = absoluteUrl(`/articles/${slug}`);
  const readingMinutes = estimateReadingMinutesJa(article.htmlBody, article.description);
  const related = await getRelatedArticles(slug, article.category, 3);
  const embedded = article.embeddedSourceLayout === true;
  const articleBodyHtml = embedded
    ? article.htmlBody
    : stripLeadingArticleHeader(article.htmlBody);

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <ArticleStructuredData
            article={{
              title: article.title,
              description: article.description,
              publishedAt: article.publishedAt,
              category: article.category,
            }}
            slug={slug}
          />
          <ArticleBreadcrumb categorySlug={article.category} articleTitle={article.title} />
          <header className="mt-2 border-b border-stone-200 pb-6">
            {embedded ? (
              <h1 className="sr-only">{article.title}</h1>
            ) : (
              <h1 className="text-3xl font-bold tracking-tight text-stone-950 md:text-4xl">
                {article.title}
              </h1>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                {embedded ? (
                  <span>
                    読了の目安：
                    <span className="ml-1 font-semibold text-stone-800">{readingMinutes}分</span>
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ArticleTextToSpeech
                  title={article.title}
                  takeaways={embedded ? [] : article.takeaways}
                  rootSelector={`[data-tts-root="${slug}"]`}
                />
                <ArticleShareActions
                  url={pageUrl}
                  title={article.title}
                  className="article-share-actions no-print flex flex-wrap items-center gap-2"
                  label={null}
                  showLineShare={false}
                  showNativeShare={false}
                  printLabel="印刷する"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-stone-600">タグ</span>
              <Link
                href={`/categories/${article.category}`}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-900 hover:bg-orange-100"
              >
                {getCategoryName(article.category)}
              </Link>
              {audience.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${encodeTagForUrl(t)}`}
                  className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
                >
                  {t}
                </Link>
              ))}
              {other.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${encodeTagForUrl(t)}`}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 hover:border-orange-200 hover:bg-orange-50/80"
                >
                  {getTagLabel(t)}
                </Link>
              ))}
            </div>
          </header>
          {!embedded ? (
            <div className="mt-6 max-w-3xl space-y-4">
              <section
                aria-labelledby="takeaways-heading"
                className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 md:p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 id="takeaways-heading" className="text-sm font-bold text-stone-900">
                      この記事でわかること
                    </h2>
                    {article.takeaways.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-800">
                        {article.takeaways.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-stone-700">
                        この記事の要点を順次更新します。
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm text-stone-500">
                    読了の目安：
                    <span className="ml-1 inline-flex items-baseline gap-0.5 font-semibold text-stone-800">
                      <span className="text-3xl leading-none">{readingMinutes}</span>
                      <span className="text-sm font-medium text-stone-600">分</span>
                    </span>
                  </p>
                </div>
              </section>
              <ArticleToc
                items={article.toc}
                variant="accordion"
                summaryLabel="目次"
                summaryHint="クリックで開く"
              />
            </div>
          ) : null}
          <div
            className={
              embedded
                ? "article-embed-root mt-6 w-full max-w-[920px]"
                : "article-body mt-6 max-w-3xl"
            }
            data-tts-root={slug}
            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
          />
          <div className="max-w-3xl">
            <RelatedArticles articles={related.map(toRelatedArticleData)} />
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
