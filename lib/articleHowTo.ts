/** 記事本文から「申請の流れ」等の手順（順序リスト）を抽出し、HowTo 構造化データ用のステップ配列を返す。 */
import { stripTags } from "@/lib/articleHtml";

/** 手順セクションと判定する見出しテキスト */
const HOWTO_HEADING = /(流れ|手順|ステップ|進め方)/;

/**
 * 手順見出し（h2/h3）直下の最初の `<ol>` の各 `<li>` をステップとして返す。
 * 誤検出を避けるため：見出しが手順系のときのみ、次の見出しより前にある最初の順序リストのみを対象にする。
 * ステップが2件未満なら空配列（HowTo を出力しない）。
 */
export function extractHowToSteps(html: string): string[] {
  const headingRe = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  let sectionStart = -1;
  while ((m = headingRe.exec(html))) {
    if (HOWTO_HEADING.test(stripTags(m[2]))) {
      sectionStart = m.index + m[0].length;
      break;
    }
  }
  if (sectionStart === -1) return [];

  const rest = html.slice(sectionStart);
  const nextHeading = rest.search(/<h[23]\b/i);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

  const olMatch = section.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return [];

  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  const steps: string[] = [];
  let li: RegExpExecArray | null;
  while ((li = liRe.exec(olMatch[1]))) {
    const text = stripTags(li[1]);
    if (text) steps.push(text);
  }
  return steps;
}
