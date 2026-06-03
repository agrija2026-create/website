/**
 * 記事 slug・カテゴリからテーマタグを提案（移行・新規記事用）。
 * 詳細: docs/theme-tags.md
 */
import {
  stripCategoryOverlapThemeTags,
  type THEME_TAG_REGISTRY,
} from "@/lib/tags";

type ThemeLabel = (typeof THEME_TAG_REGISTRY)[number]["label"];

type TagRule = {
  tag: ThemeLabel;
  patterns: RegExp[];
};

const TAG_RULES: TagRule[] = [
  { tag: "交付金", patterns: [/paddy-field-direct-payment/] },
  { tag: "大規模化", patterns: [/large-scale-growth-investment/] },
  { tag: "共同利用", patterns: [/shared-facility-infrastructure/] },
  {
    tag: "オーガニックビレッジ",
    patterns: [/organic-village-certification-paths|organic-farming-hub-expansion/],
  },
  { tag: "病害虫", patterns: [/pest-disease-forecast/] },
  { tag: "種苗", patterns: [/vegetable-seed-supply/] },
  { tag: "ドローン", patterns: [/drone-aerial/] },
  { tag: "肥料", patterns: [/^domestic-fertilizer-resource-expansion$/] },
  { tag: "災害対応", patterns: [/heavy-rain-agrifood/] },
  {
    tag: "食品ロス",
    patterns: [
      /food-loss-reduction-promotion/,
      /food-recycling-law-overview/,
      /japan-food-loss-current/,
      /food-industry-sustainability-food-loss/,
    ],
  },
  {
    tag: "流通",
    patterns: [
      /food-supply-chain-commercial/,
      /food-distribution-reorganization/,
      /logistics-innovation-promotion/,
      /food-industry-sound-development/,
    ],
  },
  {
    tag: "輸出",
    patterns: [
      /export/,
      /washoku-overseas/,
      /gfp-export/,
      /agrifood-export/,
      /jas-export/,
      /inbound-food-export/,
      /maff-prefecture-export/,
      /maff-ja-export/,
      /certified-export/,
      /export-destination/,
      /plant-variety-overseas/,
      /domestic-vegetable-share/,
      /overseas-earnings/,
      /haccp-facility-export/,
      /^vegetable-price-outlook-r8-may$/,
      /production-base-power-up-program/,
    ],
  },
  {
    tag: "農地バンク",
    patterns: [
      /nouchibank/,
      /farmland-bank/,
      /idle-farmland/,
      /farmland-consolidation/,
    ],
  },
  {
    tag: "就農",
    patterns: [
      /trial-farming-employment/,
      /trial-on-farm-employment/,
      /employment-route-farming/,
      /municipal-certified-new-farmer/,
      /women-agriculture-empowerment/,
      /women-active-promotion/,
      /creative-agricultural-management/,
    ],
  },
  {
    tag: "六次産業",
    patterns: [
      /regional-resource-value/,
      /rural-resource-/,
      /fourth-shokuiku-promotion/,
      /^seibi-55$/,
    ],
  },
  {
    tag: "金融・融資",
    patterns: [
      /jfc-agrifood-export-baseline/,
      /agricultural-modernization-fund/,
      /agricultural-improvement-fund/,
      /super-l-agricultural-infrastructure/,
      /agricultural-mutual-aid/,
      /farm-land-efficiency-loan/,
      /farmland-efficiency-loan-support/,
    ],
  },
  { tag: "森林", patterns: [/^forest-/] },
  { tag: "中山間", patterns: [/hilly-area|mountainous-area-rural/] },
  { tag: "鳥獣・ジビエ", patterns: [/wildlife-damage|jibie-utilization/] },
  {
    tag: "農村振興",
    patterns: [
      /countryside-stay-nohaku/,
      /savor-japan/,
      /rural-revitalization-platform/,
      /noufuku-collaboration/,
    ],
  },
  {
    tag: "米",
    patterns: [
      /rice-price-and-policy/,
      /government-stockpiled-rice/,
      /paddy-field-direct-payment/,
    ],
  },
  {
    tag: "みどり・環境",
    patterns: [
      /climate-biodiversity/,
      /environmental-burden-reduction/,
      /midori-business-support/,
      /agrifood-circular-economy/,
      /regional-circular-energy/,
      /biomass-local-consumption/,
    ],
  },
];

/** slug ごとの手動上書き（null = テーマタグなし） */
export const SLUG_THEME_OVERRIDES: Record<string, string[] | null> = {
  "international-standard-gap": [],
  "smart-agriculture-trend": [],
  "japan-agricultural-import-tariff-system": [],
  "climate-biodiversity-response-r6": ["みどり・環境"],
  "food-supply-crisis-countermeasures-act": [],
  "new-food-agriculture-rural-basic-plan": [],
  "agricultural-competitiveness-support-act": [],
  "ag-material-business-reorganization-support": [],
  "vegetable-market-situation-overview": [],
  "vegetable-price-stability-system": [],
  "japan-food-loss-current-situation": ["食品ロス"],
  "overseas-earnings-agrifood-export-r6": ["輸出"],
  "gfp-export-community": ["輸出"],
  "regional-farm-structure-transition-support": ["補助金"],
  "livestock-budget-r7-supplement": ["補助金"],
  "facility-horticulture-fuel-safety-net": ["補助金"],
  "private-capital-agriculture-finance-r8": ["補助金"],
  "vegetable-price-stability-measures-r8": ["補助金"],
  "successor-farm-machinery-facility-r8": ["補助金"],
  "strong-agriculture-comprehensive-grant-r8": ["補助金"],
  "pest-disease-forecast-r8-issue-1": ["病害虫"],
};

const BUDGET_DEFAULT_EXCLUDE =
  /export|finance|nouchibank|farmland-bank|paddy-field-direct|large-scale-growth|shared-facility|employment-route-farming|mutual-aid|jfc-agrifood|super-l|modernization|improvement-fund|farm-land-efficiency|farmland-efficiency-loan|domestic-fertilizer-resource-expansion|heavy-rain|drone-aerial|pest-disease-forecast|organic-village|organic-farming-hub/;

export function suggestThemeTags(slug: string, category: string): string[] {
  if (slug in SLUG_THEME_OVERRIDES) {
    const override = SLUG_THEME_OVERRIDES[slug];
    if (override === null) return [];
    return stripCategoryOverlapThemeTags(override, category).slice(0, 3);
  }

  const tags: string[] = [];
  for (const rule of TAG_RULES) {
    if (rule.patterns.some((p) => p.test(slug)) && !tags.includes(rule.tag)) {
      tags.push(rule.tag);
    }
  }

  if (
    category === "budget" &&
    tags.length === 0 &&
    !BUDGET_DEFAULT_EXCLUDE.test(slug)
  ) {
    tags.push("補助金");
  }

  return stripCategoryOverlapThemeTags(tags, category).slice(0, 3);
}
