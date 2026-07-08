/**
 * テーマごとの関連記事クラスター。
 * 各配列の先頭は入門記事（関連記事の表示順の目安）。
 */
export const ARTICLE_CLUSTERS: readonly (readonly string[])[] = [
  [
    "regional-resource-value-creation",
    "rural-resource-value-creation-policy",
    "rural-resource-value-creation-promotion",
    "rural-resource-facility-infrastructure",
  ],
  [
    "farmland-bank-guide",
    "farmland-bank-utilization-benefits",
    "farmland-bank-renewal-burden-reduction",
    "farmland-consolidation-promotion-program",
    "idle-farmland-elimination-measures",
    "farmland-bank-zero-farmer-infrastructure",
  ],
  [
    "vegetable-price-stability-system",
    "vegetable-price-stability-measures-r8",
  ],
  [
    "domestic-fertilizer-resource-expansion",
    "livestock-budget-r7-supplement",
    "biomass-local-consumption",
    "green-production-system-acceleration",
  ],
  // 融資・資金
  [
    "super-l-agricultural-infrastructure-loan",
    "agricultural-modernization-fund",
    "agricultural-improvement-fund",
    "young-farmer-interest-free-loan",
    "farm-machinery-lease-vs-buy",
  ],
  // 収入保険・共済（セーフティネット）
  [
    "agricultural-income-insurance",
    "income-insurance-comparison",
    "agricultural-mutual-aid-r8",
    "horticultural-facility-mutual-aid",
  ],
  // 年金・老後の備え
  [
    "farmers-pension-fund",
    "farmers-pension-vs-kokumin-nenkin-kikin",
    "farmers-retirement-planning-guide",
    "small-business-mutual-aid-farmers",
  ],
  // 税金・確定申告
  [
    "blue-return-farming-tax",
    "agriculture-incorporation-guide",
    "agriculture-invoice-consumption-tax",
    "farm-machinery-depreciation",
    "farmland-property-tax",
  ],
  // 輸出
  [
    "agrifood-export-promotion",
    "export-overseas-inbound-food-expansion",
    "overseas-earnings-agrifood-export-r6",
    "gfp-export-community",
    "certified-export-promotion-organization",
    "export-destination-regulation-support",
    "jfc-agrifood-export-baseline-finance",
  ],
  // 新規就農・経営継承
  [
    "new-farmer-startup-funds",
    "employment-route-farming-fund",
    "trial-farming-employment-promotion",
    "municipal-certified-new-farmer-plan-mechanism",
    "farm-succession-subsidy",
    "creative-agricultural-management-expansion",
  ],
  // 鳥獣被害・ジビエ
  [
    "wildlife-damage-countermeasures",
    "wildlife-fence-comparison",
    "electric-fence-subsidy",
    "harmful-wildlife-capture-reward",
    "hunting-license-guide",
    "jibie-utilization-promotion",
    "wildlife-damage-control-team",
  ],
  // 米・水田政策
  [
    "rice-price-and-policy-overview",
    "new-paddy-field-policy-r9",
    "paddy-field-direct-payment-r8",
    "government-stockpiled-rice",
    "rice-advance-payment",
    "rice-supply-demand-change-program",
    "rice-high-temperature-countermeasures",
  ],
  // J-クレジット・カーボン
  [
    "agriculture-carbon-credit-guide",
    "biochar-j-credit",
    "paddy-drying-j-credit",
  ],
  // 森林・林業
  [
    "forest-management-system",
    "forest-land-ownership-notification",
    "forest-co2-absorption",
    "satoyama-forest-multifunction-grant",
  ],
  // 食品ロス
  [
    "japan-food-loss-current-situation",
    "food-loss-reduction-promotion-act",
    "food-bank-donation-guide",
    "food-recycling-law-overview",
    "food-supply-chain-commercial-practices",
    "food-industry-sustainability-food-loss",
  ],
  // スマート農業
  [
    "smart-agriculture-trend",
    "smart-agriculture-technology-promotion-act",
    "smart-farm-machinery-support",
    "drone-aerial-pesticide-spraying",
    "plant-factory-hydroponics-environment-control",
  ],
  // 基盤整備・土地改良
  [
    "paddy-field-consolidation-cost",
    "subsurface-drainage-cost-subsidy",
    "land-improvement-district-fees",
    "irrigation-canal-pond-maintenance",
    "farmland-cultivation-condition-improvement",
  ],
  // 有機農業・オーガニックビレッジ
  [
    "organic-jas-certification",
    "organic-conversion-promotion",
    "advanced-organic-farming-expansion",
    "organic-farming-hub-expansion",
    "organic-village-certification-paths",
  ],
  // 物流・流通制度
  [
    "logistics-innovation-promotion",
    "produce-logistics-standardization-pallet",
    "wholesale-market-law-basics",
    "food-distribution-reorganization-support",
  ],
  // 六次産業・直販
  [
    "farm-stand-shipping-guide",
    "online-farm-products-sales",
    "direct-trade-restaurants-retailers",
    "processed-food-sales-license",
    "furusato-nozei-farm-products",
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
