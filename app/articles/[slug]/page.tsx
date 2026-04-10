import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBreadcrumb } from "@/components/ArticleBreadcrumb";
import { ArticleShareActions } from "@/components/ArticleShareActions";
import { ArticleStructuredData } from "@/components/ArticleStructuredData";
import { ArticleTakeaways } from "@/components/ArticleTakeaways";
import { ArticleToc } from "@/components/ArticleToc";
import { RelatedArticles } from "@/components/RelatedArticles";
import { Sidebar } from "@/components/Sidebar";
import { estimateReadingMinutesJa } from "@/lib/articleHtml";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import { absoluteUrl, toIsoDateTime } from "@/lib/site";
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
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      publishedTime: toIsoDateTime(article.publishedAt),
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
  const isCustomHeroArticle = slug === "nouchibank-basic-guide";
  const pageUrl = absoluteUrl(`/articles/${slug}`);
  const readingMinutes = estimateReadingMinutesJa(article.htmlBody, article.description);
  const related = await getRelatedArticles(slug, article.category, 3);
  const articleBodyHtml = isCustomHeroArticle
    ? stripLeadingArticleHeader(article.htmlBody)
    : article.htmlBody;

  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <ArticleStructuredData article={article} slug={slug} />
          <ArticleBreadcrumb categorySlug={article.category} articleTitle={article.title} />
          {isCustomHeroArticle ? (
            <>
              <header className="mt-2 border-b border-stone-200 pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-stone-950 md:text-4xl">
                      {article.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
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
                  </div>
                  <ArticleShareActions
                    url={pageUrl}
                    title={article.title}
                    className="article-share-actions no-print flex flex-wrap items-center justify-end gap-2 lg:mt-1 lg:w-auto"
                    label={null}
                    showLineShare={false}
                    showNativeShare={false}
                    printLabel="印刷する"
                  />
                </div>
              </header>
              <div className="mt-6 max-w-3xl space-y-4">
                {article.takeaways.length > 0 && (
                  <section
                    aria-labelledby="takeaways-heading"
                    className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 id="takeaways-heading" className="text-sm font-bold text-stone-900">
                          この記事でわかること
                        </h2>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-800">
                          {article.takeaways.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
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
                )}
                <ArticleToc
                  items={article.toc}
                  variant="accordion"
                  summaryLabel="章ごとのリンク"
                  summaryHint="クリックで開く"
                />
              </div>
            </>
          ) : (
            <>
              <ArticleShareActions url={pageUrl} title={article.title} />
              <header className="mt-2 border-b border-stone-200 pb-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                  <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                  <span aria-hidden>·</span>
                  <Link
                    href={`/categories/${article.category}`}
                    className="font-medium text-orange-800 hover:underline"
                  >
                    {getCategoryName(article.category)}
                  </Link>
                </div>
                {audience.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-stone-600">対象読者</span>
                    {audience.map((t) => (
                      <Link
                        key={t}
                        href={`/tags/${encodeTagForUrl(t)}`}
                        className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                )}
                {other.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-stone-600">タグ</span>
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
                )}
              </header>
              <ArticleTakeaways takeaways={article.takeaways} readingMinutes={readingMinutes} />
              <div className="mt-6 max-w-3xl">
                <ArticleToc items={article.toc} variant="mobile" />
              </div>
            </>
          )}
          <div
            className="article-body mt-6 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
          />
          <div className="max-w-3xl">
            <RelatedArticles articles={related} />
          </div>
        </div>
        <Sidebar tocItems={isCustomHeroArticle ? undefined : article.toc} />
      </div>
    </div>
  );
}
