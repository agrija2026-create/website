/** 出典ブロック（class="source"）内の外部リンク URL を抽出 */
export function extractSourceUrlsFromHtml(html: string): string[] {
  const urls = new Set<string>();
  const hrefPattern = /href=["'](https?:\/\/[^"'#]+)["']/gi;

  const sourceBlocks =
    html.match(
      /<(?:p|footer|div)[^>]*class=["'][^"']*source[^"']*["'][^>]*>[\s\S]*?<\/(?:p|footer|div)>/gi,
    ) ?? [];

  for (const block of sourceBlocks) {
    let match: RegExpExecArray | null;
    hrefPattern.lastIndex = 0;
    while ((match = hrefPattern.exec(block)) !== null) {
      urls.add(normalizeSourceUrl(match[1]));
    }
  }

  return [...urls];
}

function normalizeSourceUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "") || url;
  } catch {
    return url;
  }
}

/** frontmatter の sourceUrls と HTML 抽出結果をマージ（重複除去） */
export function mergeSourceUrls(
  fromFrontmatter: string[] | undefined,
  fromHtml: string[],
): string[] {
  const merged = new Set<string>();
  for (const url of fromFrontmatter ?? []) {
    const trimmed = url.trim();
    if (trimmed.startsWith("http")) merged.add(normalizeSourceUrl(trimmed));
  }
  for (const url of fromHtml) merged.add(url);
  return [...merged];
}
