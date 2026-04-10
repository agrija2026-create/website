/**
 * 読者向けタグ（表記固定・他タグと別扱い）。`tags` に1〜3個必須。
 * 英数字タグは従来どおり TAG_LABELS で表示名を補う。
 */
export const AUDIENCE_TAGS = ["生産者向け", "小売向け", "流通向け"] as const;

export type AudienceTag = (typeof AUDIENCE_TAGS)[number];

/** 読者タグは URL を ASCII に固定（本番で日本語パスが静的生成と一致しない問題を避ける） */
export const READER_TAG_PATH: Record<string, string> = {
  生産者向け: "reader-producers",
  小売向け: "reader-retail",
  流通向け: "reader-distribution",
};

const pathToReaderTag = Object.fromEntries(
  Object.entries(READER_TAG_PATH).map(([ja, pathSeg]) => [pathSeg, ja]),
);

/** 記事データ上のタグ → `/tags/[slug]` 用のパスセグメント */
export function encodeTagForUrl(tag: string): string {
  return READER_TAG_PATH[tag] ?? tag;
}

/** `/tags/[slug]` の param → 記事の tags と照合する文字列 */
export function decodeTagFromUrl(segment: string): string {
  return pathToReaderTag[segment] ?? segment;
}

const audienceSet = new Set<string>(AUDIENCE_TAGS);

export function isAudienceTag(tag: string): boolean {
  return audienceSet.has(tag);
}

const audiencePathSet = new Set<string>(Object.values(READER_TAG_PATH));

export function isAudienceTagPath(segment: string): boolean {
  return audiencePathSet.has(segment);
}

/** 読者タグの個数が 1〜3 でなければ例外（ビルド・開発時に検知） */
export function validateArticleAudienceTags(tags: string[], context: string): void {
  const n = tags.filter(isAudienceTag).length;
  if (n < 1 || n > 3) {
    throw new Error(
      `[articles] 読者タグは1〜3個必須です（${AUDIENCE_TAGS.join("・")}）。${context} … 該当${n}個`,
    );
  }
}

export function partitionTags(tags: string[]): {
  audience: string[];
  other: string[];
} {
  const audience = tags.filter(isAudienceTag);
  const other = tags.filter((t) => !isAudienceTag(t));
  return { audience, other };
}

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
  hojo: "補助金",
  yasai: "野菜",
  nouchibank: "農地銀行",
};

export function getTagLabel(slug: string): string {
  if (isAudienceTag(slug)) return slug;
  return TAG_LABELS[slug] ?? slug;
}
