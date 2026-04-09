import type { Article } from "@/lib/articles";
import { getCategoryName } from "@/lib/categories";
import {
  ORGANIZATION_ID,
  absoluteUrl,
  toIsoDateTime,
} from "@/lib/site";

type Props = {
  article: Article;
  slug: string;
};

export function ArticleStructuredData({ article, slug }: Props) {
  const pageUrl = absoluteUrl(`/articles/${slug}`);
  const categoryUrl = absoluteUrl(`/categories/${article.category}`);
  const categoryName = getCategoryName(article.category);
  const publishedIso = toIsoDateTime(article.publishedAt);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: publishedIso,
    dateModified: publishedIso,
    author: { "@type": "Organization", "@id": ORGANIZATION_ID },
    publisher: { "@type": "Organization", "@id": ORGANIZATION_ID },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: pageUrl,
      },
    ],
  };

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
