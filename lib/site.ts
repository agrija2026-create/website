/** 本番は https://agri-ja.net 。プレビュー時は .env.local の NEXT_PUBLIC_SITE_URL で上書き可 */
export const SITE_NAME = "農業情報メディア";

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

/** JSON-LD 用。無効なら入力をそのまま返す */
export function toIsoDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString();
}
