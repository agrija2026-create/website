import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { getCategoryName, isValidCategorySlug } from "@/lib/categories";

export const runtime = "nodejs";
export const alt = "農業情報メディアの記事";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ORANGE = "#ea580c";

export async function generateStaticParams() {
  return (await getAllArticles()).map((a) => ({ slug: a.slug }));
}

let fontCache: Buffer | null = null;
async function loadFont(): Promise<Buffer> {
  if (!fontCache) {
    fontCache = await readFile(
      join(process.cwd(), "assets/og/NotoSansJP-700.woff"),
    );
  }
  return fontCache;
}

const photoCache = new Map<string, string>();
async function loadCategoryPhoto(category: string): Promise<string> {
  const key = isValidCategorySlug(category) ? category : "default";
  const cached = photoCache.get(key);
  if (cached) return cached;
  const dir = join(process.cwd(), "public/og/category");
  let buf: Buffer;
  try {
    buf = await readFile(join(dir, `${key}.jpg`));
  } catch {
    buf = await readFile(join(dir, "default.jpg"));
  }
  const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
  photoCache.set(key, dataUrl);
  return dataUrl;
}

/** 日本語は1文字が広いので、文字数でタイトルのフォントサイズを調整する。 */
function titleFontSize(title: string): number {
  const n = title.length;
  if (n <= 20) return 72;
  if (n <= 28) return 62;
  if (n <= 36) return 54;
  if (n <= 46) return 48;
  return 42;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const title = article?.title ?? "農業情報メディア";
  const category = article?.category ?? "";
  const categoryName = category ? getCategoryName(category) : "農政・補助金";

  const [fontData, photo] = await Promise.all([
    loadFont(),
    loadCategoryPhoto(category),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          fontFamily: "NotoJP",
        }}
      >
        {/* 背景写真（カテゴリ別・1200x630） */}
        <img
          src={photo}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />
        {/* 下部スクリム（白文字の可読性確保） */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.58) 30%, rgba(0,0,0,0.05) 58%, rgba(0,0,0,0.18) 100%)",
          }}
        />
        {/* 上部の薄い陰（ロゴの可読性確保） */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "170px",
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))",
          }}
        />
        {/* ブランド（左上） */}
        <div
          style={{
            position: "absolute",
            top: "44px",
            left: "50px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "38px",
              borderRadius: "9999px",
              backgroundColor: ORANGE,
              display: "flex",
            }}
          />
          <div
            style={{
              marginLeft: "13px",
              fontSize: "27px",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 2px 8px rgba(0,0,0,0.55)",
            }}
          >
            農業情報メディア
          </div>
        </div>
        {/* カテゴリ＋タイトル（左下） */}
        <div
          style={{
            position: "absolute",
            left: "50px",
            right: "64px",
            bottom: "54px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex" }}>
            <div
              style={{
                fontSize: "23px",
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: ORANGE,
                padding: "8px 22px",
                borderRadius: "9999px",
                marginBottom: "22px",
              }}
            >
              {categoryName}
            </div>
          </div>
          <div
            style={{
              fontSize: `${titleFontSize(title)}px`,
              fontWeight: 700,
              lineHeight: 1.28,
              color: "#ffffff",
              textShadow: "0 3px 14px rgba(0,0,0,0.65)",
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoJP", data: fontData, weight: 700, style: "normal" }],
    },
  );
}
