const DANGEROUS_BLOCK_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "meta",
  "link",
];

function stripBlockedTags(html: string): string {
  let out = html;
  for (const tag of DANGEROUS_BLOCK_TAGS) {
    const paired = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    out = out.replace(paired, "");
    out = out.replace(selfClosing, "");
  }
  return out;
}

function stripInlineEventHandlers(html: string): string {
  return html.replace(/\s+on[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

function stripJavaScriptScheme(html: string): string {
  const quoted = /(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi;
  const unquoted = /(href|src)\s*=\s*javascript:[^\s>]+/gi;
  return html.replace(quoted, '$1="#"').replace(unquoted, '$1="#"');
}

function ensureNoopenerForBlankTarget(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, (anchorTag) => {
    if (!/\btarget\s*=\s*(['"])_blank\1/i.test(anchorTag)) return anchorTag;

    const relMatch = anchorTag.match(/\brel\s*=\s*(['"])(.*?)\1/i);
    if (!relMatch) {
      return anchorTag.replace(/>$/, ' rel="noopener noreferrer">');
    }

    const quote = relMatch[1];
    const currentRel = relMatch[2]
      .split(/\s+/)
      .filter(Boolean)
      .map((v) => v.toLowerCase());
    if (!currentRel.includes("noopener")) currentRel.push("noopener");
    if (!currentRel.includes("noreferrer")) currentRel.push("noreferrer");
    const nextRel = `rel=${quote}${currentRel.join(" ")}${quote}`;
    return anchorTag.replace(relMatch[0], nextRel);
  });
}

export function sanitizeTrustedHtml(inputHtml: string): string {
  const trimmed = inputHtml.trim();
  if (!trimmed) return "";
  return ensureNoopenerForBlankTarget(
    stripJavaScriptScheme(stripInlineEventHandlers(stripBlockedTags(trimmed))),
  );
}
