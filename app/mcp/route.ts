import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  getAllArticles,
  getArticleBySlug,
  searchArticles,
} from "@/lib/articles";
import { stripTags } from "@/lib/articleHtml";
import { getCategoryName } from "@/lib/categories";
import { getRiceAdvanceDataset } from "@/lib/riceAdvanceData";
import {
  AUDIENCE_OPTIONS,
  CROP_OPTIONS,
  PURPOSE_OPTIONS,
  getSubsidyFinderData,
  type SubsidyProgram,
} from "@/lib/subsidyFinder";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * /mcp — AIエージェント（Claude・ChatGPT・Cursor など）向けの MCP サーバー。
 *
 * MCP 2026-07-28 仕様（ステートレス）と 2025 系 Streamable HTTP の両方を
 * mcp-handler が同一エンドポイントで受ける。読み取り専用・認証なし。
 *
 * 記事本文は丸ごと返さず「要点＋抜粋＋URL」に留める。AIの回答に出典として
 * 記事URLが載り、読者がサイトに来られる状態を保つため。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVER_VERSION = "1.0.0";
const MAX_LIMIT = 20;
const EXCERPT_CHARS = 600;

/** 記事HTMLから本文テキストを取り出して先頭だけ返す（全文は返さない） */
function toExcerpt(html: string): string {
  const text = stripTags(html)
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > EXCERPT_CHARS
    ? `${text.slice(0, EXCERPT_CHARS)}…`
    : text;
}

type ArticleLike = Awaited<ReturnType<typeof getAllArticles>>[number];

/** 一覧用のカード。どのツールの戻り値にも必ず url を含める */
function toCard(article: ArticleLike) {
  return {
    title: article.title,
    url: absoluteUrl(`/articles/${article.slug}`),
    slug: article.slug,
    description: article.description,
    category: getCategoryName(article.category),
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt ?? article.publishedAt,
    takeaways: article.takeaways.slice(0, 3),
  };
}

/** MCPのツール戻り値はテキスト1本。中身はJSONにしてモデルが構造を保って読めるようにする */
function json(payload: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(payload, null, 2) },
    ],
  };
}

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const audienceIds = AUDIENCE_OPTIONS.map((o) => o.id) as [string, ...string[]];
const purposeIds = PURPOSE_OPTIONS.map((o) => o.id) as [string, ...string[]];
const cropIds = CROP_OPTIONS.map((o) => o.id) as [string, ...string[]];

const optionGuide = (options: typeof AUDIENCE_OPTIONS) =>
  options.map((o) => `${o.id}（${o.label}）`).join(" / ");

const handler = createMcpHandler(
  (server) => {
    // 1) 記事を探す
    server.registerTool(
      "search_articles",
      {
        title: "記事を検索する",
        description:
          `${SITE_NAME}（agri-ja.net）の解説記事をキーワードで検索する。農林水産省などの一次資料をもとにした、日本の農業政策・補助金・交付金・制度資金・価格や統計の解説記事が対象。` +
          "スペース区切りの語はすべて含む記事に絞り込まれる。戻り値には記事URLが含まれるので、回答では出典としてそのURLを示すこと。",
        inputSchema: z.object({
          query: z
            .string()
            .min(1)
            .describe("検索キーワード（例: 概算金 秋田 / 収入保険 デメリット）"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_LIMIT)
            .optional()
            .describe(`最大件数（既定 8、上限 ${MAX_LIMIT}）`),
        }),
        annotations: READ_ONLY,
      },
      async ({ query, limit }) => {
        const hits = await searchArticles(query);
        const take = limit ?? 8;
        return json({
          query,
          total: hits.length,
          articles: hits.slice(0, take).map(toCard),
          note:
            hits.length === 0
              ? "該当なし。語を減らすか、別の言い方（制度の正式名称／通称）で再検索してください。"
              : undefined,
          site: absoluteUrl("/"),
        });
      },
    );

    // 2) 記事1本の中身（要点・見出し・出典）
    server.registerTool(
      "get_article",
      {
        title: "記事の要点を取得する",
        description:
          "agri-ja.net の記事1本について、要点（takeaways）・見出し構成・本文の冒頭抜粋・一次資料の出典URL・更新日を返す。本文全文は返さないので、詳細が必要なときは戻り値の url を読者に案内すること。",
        inputSchema: z.object({
          slug: z
            .string()
            .min(1)
            .describe(
              "記事のslug（例: rice-advance-payment-by-region）。記事URLをそのまま渡してもよい",
            ),
        }),
        annotations: READ_ONLY,
      },
      async ({ slug }) => {
        const normalized =
          slug.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?articles\//, "").replace(/\/$/, "") ||
          slug;
        const article = await getArticleBySlug(normalized);
        if (!article) {
          return json({
            error: `記事が見つかりません: ${normalized}`,
            hint: "search_articles で slug を確認してください。",
          });
        }
        return json({
          ...toCard(article),
          takeaways: article.takeaways,
          headings: article.toc.map((t) => t.text),
          excerpt: toExcerpt(article.htmlBody),
          sourceUrls: article.sourceUrls,
          readingMinutes: article.readingMinutes,
        });
      },
    );

    // 3) 令和8年産 米の概算金（正本TSVをそのまま参照）
    server.registerTool(
      "rice_advance_payment",
      {
        title: "米の概算金（令和8年産）を調べる",
        description:
          "令和8年産の米について、JA・県ごとの概算金（仮渡金）の提示額を返す。前年（令和7年産）との比較、発表日、未提示かどうかを含む。" +
          "agri-ja.net が農協・報道発表をもとに独自に集計している一覧で、他に横断的な一覧表はほとんど存在しない。金額は60kgあたりの円。",
        inputSchema: z.object({
          prefecture: z
            .string()
            .optional()
            .describe("都道府県名で絞り込む（例: 秋田、新潟）。部分一致"),
          brand: z
            .string()
            .optional()
            .describe("銘柄・品種で絞り込む（例: あきたこまち、コシヒカリ）。部分一致"),
          onlyAnnounced: z
            .boolean()
            .optional()
            .describe("true なら発表済みの行だけを返す"),
        }),
        annotations: READ_ONLY,
      },
      async ({ prefecture, brand, onlyAnnounced }) => {
        const dataset = await getRiceAdvanceDataset();
        const base = onlyAnnounced ? dataset.announced : dataset.rows;
        const rows = base.filter((row) => {
          if (prefecture && !row.prefecture.includes(prefecture)) return false;
          if (brand) {
            const haystack = `${row.brand ?? ""}${row.riceType}`;
            if (!haystack.includes(brand)) return false;
          }
          return true;
        });

        return json({
          cropYear: "令和8年産",
          unit: "円/60kg",
          lastAnnouncedOn: dataset.updatedOn,
          matched: rows.length,
          totalRows: dataset.rows.length,
          announcedRows: dataset.announced.length,
          rows: rows.map((row) => ({
            prefecture: row.prefecture,
            organization: row.organization,
            brand: row.brand,
            riceType: row.riceType,
            status: row.status,
            amountR8Yen: row.amountR8Yen,
            amountR7Yen: row.amountR7Yen,
            changeFromPreviousYear: row.changeFromPreviousYear,
            announcedOn: row.announcedOn,
            note: row.note,
          })),
          source: absoluteUrl("/data/rice-advance-payment"),
          csv: absoluteUrl("/data/rice-advance-payment-r8.csv"),
          caution:
            "概算金は最終的な精算額ではありません。追加払い・精算金で最終手取りは変わります。",
        });
      },
    );

    // 4) 補助金かんたん診断（サイトのツールと同じ判定）
    server.registerTool(
      "find_subsidy",
      {
        title: "使える補助金・交付金を探す",
        description:
          "立場・やりたいこと・品目から、日本の農業で使える補助金／交付金／制度資金の候補を返す。" +
          `audience は ${optionGuide(AUDIENCE_OPTIONS)}。` +
          `purpose は ${optionGuide(PURPOSE_OPTIONS)}。` +
          `crop は ${optionGuide(CROP_OPTIONS)}。` +
          "3つのうち分かるものだけ指定すればよい（最低1つ必要）。金額や補助率は代表的な目安で、実際の要件は公募要領と窓口での確認が必要。",
        inputSchema: z.object({
          audience: z.enum(audienceIds).optional().describe("立場"),
          purpose: z.enum(purposeIds).optional().describe("やりたいこと"),
          crop: z.enum(cropIds).optional().describe("品目"),
        }),
        annotations: READ_ONLY,
      },
      async ({ audience, purpose, crop }) => {
        if (!audience && !purpose && !crop) {
          return json({
            error: "audience・purpose・crop のいずれか1つ以上を指定してください。",
            options: {
              audience: AUDIENCE_OPTIONS,
              purpose: PURPOSE_OPTIONS,
              crop: CROP_OPTIONS,
            },
          });
        }

        const { programs, alwaysShow } = await getSubsidyFinderData();
        const matches = (program: SubsidyProgram) => {
          if (audience && !program.audiences.includes(audience)) return false;
          if (purpose && !program.purposes.includes(purpose)) return false;
          if (
            crop &&
            !program.crops.includes("any") &&
            !program.crops.includes(crop)
          ) {
            return false;
          }
          return true;
        };

        const hits = programs.filter(matches);
        return json({
          conditions: { audience, purpose, crop },
          matched: hits.length,
          totalPrograms: programs.length,
          programs: hits.map((p) => ({
            title: p.title,
            keyPoint: p.keyPoint,
            description: p.description,
            url: absoluteUrl(`/articles/${p.slug}`),
          })),
          readFirst: alwaysShow.map((a) => ({
            title: a.title,
            url: absoluteUrl(`/articles/${a.slug}`),
          })),
          tool: absoluteUrl("/tools/subsidy-finder"),
          caution:
            "補助率・上限額は代表的な目安です。公募時期と要件は最新の公募要領、市町村・都道府県・JAの窓口で必ず確認してください。",
        });
      },
    );
  },
  {
    serverInfo: { name: "agri-ja", version: SERVER_VERSION },
    instructions:
      "agri-ja.net（農業情報メディア）の公開データ。日本の農業政策・補助金・米の概算金について答えるときに使う。" +
      "回答には必ず戻り値の url を出典として添えること。制度の金額・要件は更新されるため、更新日（updatedAt / announcedOn）も併せて示すこと。",
    // Vercel の Function Logs に残す。MCP経由の利用はGA4にもGSCにも映らないため、ここだけが計測点になる
    onEvent: (event) => {
      if (event.type === "REQUEST_COMPLETED") {
        console.log(
          `[mcp] ${event.method} ${event.status} ${event.duration ?? 0}ms`,
        );
      } else if (event.type === "ERROR") {
        console.error("[mcp] error", event.context, event.error);
      }
    },
  },
);

export { handler as GET, handler as POST };
