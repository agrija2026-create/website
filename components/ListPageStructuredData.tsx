import {
  buildCollectionPageJsonLd,
  buildListBreadcrumbJsonLd,
  type BreadcrumbCrumb,
  type ListItemInput,
} from "@/lib/listStructuredData";

type Props = {
  name: string;
  description: string;
  url: string;
  breadcrumbs: BreadcrumbCrumb[];
  items: ListItemInput[];
};

/** 記事一覧ページ（カテゴリ/タグ）用の CollectionPage + BreadcrumbList を出力。 */
export function ListPageStructuredData({
  name,
  description,
  url,
  breadcrumbs,
  items,
}: Props) {
  const collectionLd = buildCollectionPageJsonLd({ name, description, url, items });
  const breadcrumbLd = buildListBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
