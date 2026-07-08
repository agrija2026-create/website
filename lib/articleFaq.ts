/** 記事本文 HTML から「よくある質問」節を抽出し、FAQPage 構造化データ用の Q&A 配列を返す。 */
import { stripTags } from "@/lib/articleHtml";

export type FaqItem = { question: string; answer: string };

/** h2 が FAQ 見出しか（id="faq" もしくは見出しテキストが「よくある質問」等）を判定 */
function isFaqHeading(attrs: string, innerText: string): boolean {
  if (/\bid\s*=\s*(["'])faq\1/i.test(attrs)) return true;
  const compact = innerText.replace(/\s+/g, "");
  return /^(よくある質問|Q&A|FAQ)/i.test(compact);
}

/**
 * FAQ 節（`<h2 id="faq">` または「よくある質問」見出し以降、次の h2 まで）の
 * `<h3>`＝質問 / 後続コンテンツ＝回答 を対にして返す。回答はタグを除去したプレーンテキスト。
 * 対を作れない見出しは除外する。
 */
export function extractFaqItems(html: string): FaqItem[] {
  const h2Re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  const h2s: { start: number; end: number; attrs: string; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(html))) {
    h2s.push({
      start: m.index,
      end: m.index + m[0].length,
      attrs: m[1],
      text: stripTags(m[2]),
    });
  }

  let faqStart = -1;
  let faqEnd = html.length;
  for (let i = 0; i < h2s.length; i += 1) {
    if (isFaqHeading(h2s[i].attrs, h2s[i].text)) {
      faqStart = h2s[i].end;
      faqEnd = i + 1 < h2s.length ? h2s[i + 1].start : html.length;
      break;
    }
  }
  if (faqStart === -1) return [];

  const block = html.slice(faqStart, faqEnd);
  const h3Re = /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi;
  const questions: { qEnd: number; nextStart: number; text: string }[] = [];
  let q: RegExpExecArray | null;
  while ((q = h3Re.exec(block))) {
    questions.push({
      qEnd: q.index + q[0].length,
      nextStart: q.index,
      text: stripTags(q[1]),
    });
  }

  const items: FaqItem[] = [];
  for (let i = 0; i < questions.length; i += 1) {
    const answerStart = questions[i].qEnd;
    const answerEnd =
      i + 1 < questions.length ? questions[i + 1].nextStart : block.length;
    const question = questions[i].text.trim();
    const answer = stripTags(block.slice(answerStart, answerEnd));
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}
