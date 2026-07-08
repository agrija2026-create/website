/**
 * 読者向けタグ（表記固定）。`tags` に1〜3個必須。
 * テーマタグは日本語ラベル固定・正規語彙のみ（`THEME_TAG_REGISTRY`）。
 */
export const AUDIENCE_TAGS = ["生産者向け", "小売向け", "流通向け"] as const;

export type AudienceTag = (typeof AUDIENCE_TAGS)[number];

export type ThemeTagDef = {
  label: string;
  urlSlug: string;
  /** サイドバー「タグ一覧」に載せるか */
  listedInSidebar: boolean;
};

/** 正規テーマタグ（frontmatter に書く日本語ラベル） */
export const THEME_TAG_REGISTRY: readonly ThemeTagDef[] = [
  { label: "補助金", urlSlug: "subsidy", listedInSidebar: true },
  { label: "輸出", urlSlug: "export", listedInSidebar: true },
  { label: "農地バンク", urlSlug: "nouchibank", listedInSidebar: true },
  { label: "金融・融資", urlSlug: "finance", listedInSidebar: true },
  { label: "年金・保険", urlSlug: "pension-insurance", listedInSidebar: true },
  { label: "税金", urlSlug: "tax", listedInSidebar: true },
  { label: "基盤整備", urlSlug: "land-improvement", listedInSidebar: true },
  { label: "食品ロス", urlSlug: "food-loss", listedInSidebar: true },
  { label: "流通", urlSlug: "distribution", listedInSidebar: true },
  { label: "就農", urlSlug: "employment", listedInSidebar: true },
  { label: "六次産業", urlSlug: "sixth-industry", listedInSidebar: true },
  { label: "共同利用", urlSlug: "facility", listedInSidebar: true },
  { label: "大規模化", urlSlug: "large-scale-growth-subsidy", listedInSidebar: true },
  { label: "交付金", urlSlug: "direct-payment", listedInSidebar: true },
  { label: "オーガニックビレッジ", urlSlug: "organic-village", listedInSidebar: true },
  { label: "災害対応", urlSlug: "disaster", listedInSidebar: true },
  { label: "肥料", urlSlug: "fertilizer", listedInSidebar: true },
  { label: "病害虫", urlSlug: "byogaichu", listedInSidebar: true },
  { label: "種苗", urlSlug: "seed", listedInSidebar: true },
  { label: "ドローン", urlSlug: "drone", listedInSidebar: true },
  { label: "森林", urlSlug: "forestry", listedInSidebar: true },
  { label: "中山間", urlSlug: "hilly-area", listedInSidebar: true },
  { label: "鳥獣・ジビエ", urlSlug: "wildlife", listedInSidebar: true },
  { label: "農村振興", urlSlug: "rural-revitalization", listedInSidebar: true },
  { label: "米", urlSlug: "rice", listedInSidebar: true },
  { label: "畜産", urlSlug: "livestock", listedInSidebar: true },
  { label: "みどり・環境", urlSlug: "midori", listedInSidebar: true },
] as const;

export const THEME_TAG_LABELS = THEME_TAG_REGISTRY.map((t) => t.label);

const themeByLabel = new Map(THEME_TAG_REGISTRY.map((t) => [t.label, t]));
const themeByUrlSlug = new Map(THEME_TAG_REGISTRY.map((t) => [t.urlSlug, t]));

/** カテゴリ slug → 付けてはいけないテーマタグ（カテゴリ表示と同義） */
export const CATEGORY_THEME_OVERLAP: Record<string, string> = {
  policy: "政策",
  budget: "予算",
  logistics: "物流",
  technology: "スマート農業",
  production: "野菜",
  market: "野菜",
};

/** 移行用：旧英語・廃止タグ → 新ラベル（null は削除） */
export const LEGACY_THEME_TAG_MAP: Record<string, string | null> = {
  maff: null,
  policy: null,
  budget: null,
  logistics: null,
  yasai: null,
  "smart-agriculture": null,
  "basic-plan": null,
  hojo: "補助金",
  facility: "共同利用",
  nouchibank: "農地バンク",
  "direct-payment": "交付金",
  export: "輸出",
  輸出: "輸出",
  seed: "種苗",
  disaster: "災害対応",
  drone: "ドローン",
  employment: "就農",
  fertilizer: "肥料",
  finance: "金融・融資",
  "new-farmer": "就農",
  "large-scale-growth-subsidy": "大規模化",
  病害虫: "病害虫",
  オーガニックビレッジ: "オーガニックビレッジ",
};

/** 読者タグは URL を ASCII に固定 */
export const READER_TAG_PATH: Record<string, string> = {
  生産者向け: "reader-producers",
  小売向け: "reader-retail",
  流通向け: "reader-distribution",
};

const pathToReaderTag = Object.fromEntries(
  Object.entries(READER_TAG_PATH).map(([ja, pathSeg]) => [pathSeg, ja]),
);

export function encodeTagForUrl(tag: string): string {
  const reader = READER_TAG_PATH[tag];
  if (reader) return reader;
  const theme = themeByLabel.get(tag);
  if (theme) return theme.urlSlug;
  return tag;
}

export function decodeTagFromUrl(segment: string): string {
  const reader = pathToReaderTag[segment];
  if (reader) return reader;
  const theme = themeByUrlSlug.get(segment);
  if (theme) return theme.label;
  return segment;
}

const audienceSet = new Set<string>(AUDIENCE_TAGS);

export function isAudienceTag(tag: string): boolean {
  return audienceSet.has(tag);
}

const audiencePathSet = new Set<string>(Object.values(READER_TAG_PATH));

export function isAudienceTagPath(segment: string): boolean {
  return audiencePathSet.has(segment);
}

export function isThemeTag(tag: string): boolean {
  return themeByLabel.has(tag);
}

export function isListedInSidebar(tag: string): boolean {
  return themeByLabel.get(tag)?.listedInSidebar ?? false;
}

export function validateArticleAudienceTags(tags: string[], context: string): void {
  const n = tags.filter(isAudienceTag).length;
  if (n < 1 || n > 3) {
    throw new Error(
      `[articles] 読者タグは1〜3個必須です（${AUDIENCE_TAGS.join("・")}）。${context} … 該当${n}個`,
    );
  }
}

const MAX_THEME_TAGS = 3;

export function validateArticleThemeTags(tags: string[], context: string): void {
  const theme = tags.filter((t) => !isAudienceTag(t));
  if (theme.length > MAX_THEME_TAGS) {
    throw new Error(
      `[articles] テーマタグは0〜${MAX_THEME_TAGS}個です。${context} … 該当${theme.length}個`,
    );
  }
  for (const t of theme) {
    if (!isThemeTag(t)) {
      throw new Error(
        `[articles] 未登録のテーマタグ「${t}」。正規語彙は docs/theme-tags.md を参照。${context}`,
      );
    }
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

/** カテゴリと同義のテーマタグを除去 */
export function stripCategoryOverlapThemeTags(
  themeTags: string[],
  categorySlug: string,
): string[] {
  const overlap = CATEGORY_THEME_OVERLAP[categorySlug];
  if (!overlap) return themeTags;
  return themeTags.filter((t) => t !== overlap);
}

export function getTagLabel(tag: string): string {
  if (isAudienceTag(tag)) return tag;
  if (isThemeTag(tag)) return tag;
  return tag;
}

/**
 * タグ一覧ページ（/tags/[slug]）は、個別記事では取りにくい「ビッグワード」を
 * 束ねて狙うハブとして使う。各テーマタグの SEO タイトル先頭に置く検索ヘッドワード。
 * 未登録のテーマタグは `農業の${label}` を既定とする（例: 補助金→農業の補助金）。
 */
const THEME_TAG_SEO_HEAD: Record<string, string> = {
  輸出: "農産物の輸出",
  農地バンク: "農地バンク",
  "金融・融資": "農業の融資・資金調達",
  "年金・保険": "農業者年金・農業保険",
  食品ロス: "食品ロスの削減",
  流通: "農産物の流通",
  就農: "新規就農",
  六次産業: "六次産業化",
  共同利用: "農業機械の共同利用",
  オーガニックビレッジ: "オーガニックビレッジ",
  ドローン: "農業用ドローン",
  森林: "森林・林業",
  中山間: "中山間地域",
  "鳥獣・ジビエ": "鳥獣被害・ジビエ",
  農村振興: "農村振興",
  米: "米政策・米価",
  "みどり・環境": "みどりの食料システム戦略",
};

/** テーマタグ一覧ページの SEO タイトル先頭に置く検索ヘッドワードを返す。 */
export function getThemeTagSeoHead(label: string): string {
  return THEME_TAG_SEO_HEAD[label] ?? `農業の${label}`;
}

/** フッター等のハブ用：ヘッドワードを持つ主要テーマタグ（label / head / URL セグメント）。 */
export function getSeoHeadThemeTags(): {
  label: string;
  head: string;
  urlSlug: string;
}[] {
  return Object.keys(THEME_TAG_SEO_HEAD).map((label) => ({
    label,
    head: THEME_TAG_SEO_HEAD[label],
    urlSlug: encodeTagForUrl(label),
  }));
}

export type SidebarThemeTag = {
  label: string;
  count: number;
};

/** サイドバー「タグ一覧」用（listedInSidebar のみ・件数降順） */
export function buildSidebarThemeTags(
  tagCounts: Map<string, number>,
): SidebarThemeTag[] {
  const out: SidebarThemeTag[] = [];
  for (const def of THEME_TAG_REGISTRY) {
    if (!def.listedInSidebar) continue;
    const count = tagCounts.get(def.label) ?? 0;
    if (count < 1) continue;
    out.push({ label: def.label, count });
  }
  out.sort(
    (a, b) =>
      b.count - a.count || a.label.localeCompare(b.label, "ja"),
  );
  return out;
}
