/**
 * カテゴリマスタ（slug → 表示名）。slug は英語（URL 用）。
 * 未定義の slug が記事に含まれた場合は getCategoryName で slug をそのまま返す。
 */
export const CATEGORY_MAP: Record<string, string> = {
  policy: "政策・制度",
  budget: "予算・財政",
  market: "市場・価格・需給",
  logistics: "流通・物流",
  production: "生産・作物（野菜・園芸）",
  farmland: "農地・担い手・経営",
  technology: "技術・DX・スマート農業",
  "food-safety": "表示・規格・食品安全",
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_MAP) as readonly string[];

export function getCategoryName(slug: string): string {
  return CATEGORY_MAP[slug] ?? slug;
}

export function isValidCategorySlug(slug: string): boolean {
  return slug in CATEGORY_MAP;
}
