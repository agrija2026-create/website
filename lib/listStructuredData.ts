/** カテゴリ／タグなど「記事一覧ページ」用の構造化データ（CollectionPage + ItemList + BreadcrumbList）。 */
import { SITE_URL_ORIGIN, absoluteUrl } from "@/lib/site";

export type ListItemInput = { title: string; slug: string };
export type BreadcrumbCrumb = { name: string; url: string };

function buildItemList(items: ListItemInput[]): Record<string, unknown> {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/articles/${item.slug}`),
      name: item.title,
    })),
  };
}

export function buildCollectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  items: ListItemInput[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: "ja",
    isPartOf: { "@id": `${SITE_URL_ORIGIN}/#website` },
    mainEntity: buildItemList(opts.items),
  };
}

export function buildListBreadcrumbJsonLd(
  crumbs: BreadcrumbCrumb[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
