import {
  buildArticleBreadcrumbJsonLd,
  buildArticleFaqJsonLd,
  buildArticleJsonLd,
  type ArticleStructuredDataInput,
} from "@/lib/articleStructuredData";
import type { FaqItem } from "@/lib/articleFaq";

type Props = {
  article: ArticleStructuredDataInput;
  slug: string;
  faqItems?: FaqItem[];
};

export function ArticleStructuredData({ article, slug, faqItems = [] }: Props) {
  const articleLd = buildArticleJsonLd(article, slug);
  const breadcrumbLd = buildArticleBreadcrumbJsonLd(article, slug);
  const faqLd = buildArticleFaqJsonLd(faqItems);

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
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
    </>
  );
}
