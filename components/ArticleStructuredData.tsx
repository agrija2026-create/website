import {
  buildArticleBreadcrumbJsonLd,
  buildArticleJsonLd,
  type ArticleStructuredDataInput,
} from "@/lib/articleStructuredData";

type Props = {
  article: ArticleStructuredDataInput;
  slug: string;
};

export function ArticleStructuredData({ article, slug }: Props) {
  const articleLd = buildArticleJsonLd(article, slug);
  const breadcrumbLd = buildArticleBreadcrumbJsonLd(article, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
