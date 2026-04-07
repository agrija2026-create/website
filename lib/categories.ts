/**
 * カテゴリマスタ（slug → 表示名）。
 * 未定義の slug が記事に含まれた場合は getCategoryName で slug をそのまま返す。
 */
export const CATEGORY_MAP: Record<string, string> = {
  seisaku: "政策・制度",
  yosan: "予算・財政",
  shijo: "市場・価格",
  gijutsu: "技術・DX",
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_MAP) as readonly string[];

export function getCategoryName(slug: string): string {
  return CATEGORY_MAP[slug] ?? slug;
}

export function isValidCategorySlug(slug: string): boolean {
  return slug in CATEGORY_MAP;
}
