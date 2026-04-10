/** 本番は https://agri-ja.net 。プレビュー時は .env.local の NEXT_PUBLIC_SITE_URL で上書き可 */
export const SITE_NAME = "農業情報メディア";
export const SITE_LOCALE = "ja_JP";
export const SITE_X_HANDLE = "@agri_ja";
export const TOP_PAGE_TITLE = "農業情報メディア | 農政・補助金・農業政策をわかりやすく解説";
export const SITE_DESCRIPTION =
  "農政をもっと身近に。農林水産省の政策・制度・補助金・予算の動きを、生産者・流通・小売向けにわかりやすく整理する農業情報メディアです。";
export const DEFAULT_OG_IMAGE_PATH = "/og/site-default.png";
export const DEFAULT_OG_IMAGE_ALT =
  "農業情報メディア 農政をもっと身近に。政策・制度をわかりやすく解説";

const rawSiteUrl =
  typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
  process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_SITE_URL.trim()
    : "https://agri-ja.net";

export const SITE_URL_ORIGIN = new URL(
  rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl,
).origin;

export const ORGANIZATION_ID = `${SITE_URL_ORIGIN}/#organization`;

export const SAME_AS_SOCIAL = ["https://x.com/agri_ja"] as const;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL_ORIGIN}${p}`;
}

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

export function getDefaultOgImage() {
  return [
    {
      url: getDefaultOgImageUrl(),
      width: 1024,
      height: 554,
      alt: DEFAULT_OG_IMAGE_ALT,
    },
  ];
}

export function buildAudiencePageDescription(label: string): string {
  return `${label}に役立つ農業政策・制度・補助金・予算の記事を一覧で読めます。農業情報メディアが、一次情報ベースで要点をわかりやすく整理します。`;
}

export function buildCategoryPageDescription(name: string): string {
  return `カテゴリ「${name}」の記事一覧です。農業政策・制度・補助金・予算の動きを、農業情報メディアがわかりやすく整理します。`;
}

/** JSON-LD 用。無効なら入力をそのまま返す */
export function toIsoDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString();
}
