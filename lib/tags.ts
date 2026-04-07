/**
 * タグ slug → 日本語表示名（frontmatter の tags は英数字スラッグ）。
 * 未定義は slug をそのまま表示。
 */
export const TAG_LABELS: Record<string, string> = {
  "smart-agriculture": "スマート農業",
  maff: "農林水産省",
  "basic-plan": "基本計画",
  budget: "予算",
  policy: "政策",
  r8: "R8年度",
  logistics: "物流",
  "direct-payment": "直接支払交付金",
  facility: "共同利用施設",
};

export function getTagLabel(slug: string): string {
  return TAG_LABELS[slug] ?? slug;
}
