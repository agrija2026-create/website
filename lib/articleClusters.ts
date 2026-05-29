/**
 * テーマごとの関連記事クラスター。
 * 各配列の先頭は入門記事（関連記事の表示順の目安）。
 */
export const ARTICLE_CLUSTERS: readonly (readonly string[])[] = [
  [
    "regional-resource-value-creation",
    "rural-resource-value-creation-policy",
    "rural-resource-promotion-soushutsu",
    "rural-resource-facility-infrastructure",
  ],
  [
    "nouchibank-basic-guide",
    "farmland-bank-utilization-benefits",
    "nouchibank-koshin-futan-keigen",
    "farmland-consolidation-promotion-program",
    "idle-farmland-elimination-measures",
    "farmland-bank-zero-farmer-infrastructure",
  ],
  [
    "vegetable-price-stability-system",
    "yasai-kakaku-antei-r8",
  ],
] as const;

const slugToCluster = new Map<string, readonly string[]>(
  ARTICLE_CLUSTERS.flatMap((cluster) =>
    cluster.map((slug) => [slug, cluster] as const),
  ),
);

/** 記事 slug が属するクラスター（未定義なら undefined） */
export function getArticleCluster(slug: string): readonly string[] | undefined {
  return slugToCluster.get(slug);
}
