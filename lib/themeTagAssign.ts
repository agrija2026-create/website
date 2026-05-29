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
  { tag: "交付金", patterns: [/suiden-katsuyo-direct-payment/] },
  { tag: "大規模化", patterns: [/daikibo-5koubo/] },
  { tag: "共同利用", patterns: [/kyodo-riyo-shisetsu/] },
  {
    tag: "オーガニックビレッジ",
    patterns: [/organic-village-124|organic-farming-hub-expansion/],
  },
  { tag: "病害虫", patterns: [/byogaichu-hassei/] },
  { tag: "種苗", patterns: [/yasai-shushi-antei/] },
  { tag: "ドローン", patterns: [/drone-aerial/] },
  { tag: "肥料", patterns: [/^budget-15$/] },
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
      /kokusan-shea/,
      /overseas-earnings/,
      /haccp-facility-export/,
      /^index-163$/,
      /sanchipu-71/,
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
];

/** slug ごとの手動上書き（null = テーマタグなし） */
export const SLUG_THEME_OVERRIDES: Record<string, string[] | null> = {
  "international-standard-gap": [],
  "smart-agriculture-trend": [],
  "japan-agricultural-import-tariff-system": [],
  "climate-biodiversity-response-r6": [],
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
  "koudoka-r7hosei-4": ["補助金"],
  "facility-horticulture-fuel-safety-net": ["補助金"],
  "r8kettei-pr41": ["補助金"],
  "yasai-kakaku-antei-r8": ["補助金"],
  "ninaite-kikai-shisetsu-r8": ["補助金"],
  "tsuyoi-nogyo-sogo-shien-r8": ["補助金"],
  "r8-byogaichu-hassei-yoho-1": ["病害虫"],
};

const BUDGET_DEFAULT_EXCLUDE =
  /export|finance|nouchibank|farmland-bank|suiden|daikibo|kyodo-riyo|employment-route-farming|mutual-aid|jfc-agrifood|super-l|modernization|improvement-fund|farm-land-efficiency|farmland-efficiency-loan|budget-15|heavy-rain|drone-aerial|byogaichu|organic-village|organic-farming-hub/;

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
