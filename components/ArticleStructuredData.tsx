import {
  buildArticleBreadcrumbJsonLd,
  buildArticleFaqJsonLd,
  buildArticleHowToJsonLd,
  buildArticleJsonLd,
  type ArticleStructuredDataInput,
} from "@/lib/articleStructuredData";
import type { FaqItem } from "@/lib/articleFaq";

type Props = {
  article: ArticleStructuredDataInput;
  slug: string;
  faqItems?: FaqItem[];
  howToSteps?: string[];
};

export function ArticleStructuredData({
  article,
  slug,
  faqItems = [],
  howToSteps = [],
}: Props) {
  const articleLd = buildArticleJsonLd(article, slug);
  const breadcrumbLd = buildArticleBreadcrumbJsonLd(article, slug);
  const faqLd = buildArticleFaqJsonLd(faqItems);
  const howToLd = buildArticleHowToJsonLd(article.title, howToSteps);

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
      {howToLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      ) : null}
    </>
  );
}
