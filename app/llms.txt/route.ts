import { getAllArticles } from "@/lib/articles";
import { CATEGORY_SLUGS, getCategoryName } from "@/lib/categories";
import {
  SITE_KNOWS_ABOUT,
  SITE_NAME,
  SITE_ORG_DESCRIPTION,
  absoluteUrl,
} from "@/lib/site";

export const dynamic = "force-static";

type Art = Awaited<ReturnType<typeof getAllArticles>>[number];

/**
 * /llms.txt — 生成AI・AI検索向けのサイト地図（llms.txt 標準）。
 * 全記事をカテゴリ別に、タイトル・URL・説明つきで列挙する。記事の追加で自動更新。
 */
export async function GET() {
  const articles = await getAllArticles();

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}（agri-ja.net）`);
  lines.push("");
  lines.push(`> ${SITE_ORG_DESCRIPTION}`);
  lines.push("");
  lines.push(
    `農林水産省などの一次資料をもとに、政策・制度・補助金・予算の動きを生産者・流通・小売の実務目線で整理しています。すべての記事は無料で公開しています。主な専門領域：${SITE_KNOWS_ABOUT.join("、")}。`,
  );
  lines.push("");
  lines.push(
    `全記事の機械可読な索引は ${absoluteUrl("/sitemap.xml")} にあります。`,
  );
  lines.push("");
  // MCPサーバーの所在。自動発見の標準（Server Card）が固まるまでは、ここが唯一の告知点になる
  lines.push("## AIエージェント向け（MCP）");
  lines.push("");
  lines.push(
    `記事検索・記事の要点取得・令和8年産米の概算金（産地別）・補助金診断を、MCP（Model Context Protocol）ツールとして公開しています。エンドポイントは ${absoluteUrl("/mcp")}（Streamable HTTP・認証不要・読み取り専用）。Claude や ChatGPT にはカスタムコネクタとしてこのURLを登録すると利用できます。`,
  );
  lines.push("");

  // カテゴリ別にまとめる（CATEGORY_SLUGS の順を優先し、未定義カテゴリは末尾へ）
  const byCategory = new Map<string, Art[]>();
  for (const slug of CATEGORY_SLUGS) byCategory.set(slug, []);
  for (const a of articles) {
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }

  for (const [slug, list] of byCategory) {
    if (list.length === 0) continue;
    // 更新日（なければ公開日）の新しい順
    list.sort((x, y) =>
      (y.updatedAt ?? y.publishedAt).localeCompare(x.updatedAt ?? x.publishedAt),
    );
    lines.push(`## ${getCategoryName(slug)}`);
    lines.push("");
    for (const a of list) {
      lines.push(
        `- [${a.title}](${absoluteUrl(`/articles/${a.slug}`)}): ${a.description}`,
      );
    }
    lines.push("");
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
