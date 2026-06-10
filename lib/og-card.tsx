import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isValidCategorySlug } from "@/lib/categories";

/** OGP/Twitter カードの共通サイズ */
export const OG_SIZE = { width: 1200, height: 630 };
const ORANGE = "#ea580c";

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
async function loadPhoto(key: string): Promise<string> {
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

/**
 * 記事・トップ・カテゴリ・タグ共通のOGPカード（1200x630）を生成する。
 * photoKey は 8カテゴリの slug（不一致なら default.jpg にフォールバック）。
 * chip を null にするとカテゴリチップを出さない（トップ用）。
 */
export async function renderOgCard({
  title,
  chip,
  photoKey,
}: {
  title: string;
  chip?: string | null;
  photoKey?: string;
}): Promise<ImageResponse> {
  const key = photoKey && isValidCategorySlug(photoKey) ? photoKey : "default";
  const [fontData, photo] = await Promise.all([loadFont(), loadPhoto(key)]);

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
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.7) 26%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.06) 70%, rgba(0,0,0,0.18) 100%)",
          }}
        />
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
        <div
          style={{
            position: "absolute",
            left: "50px",
            right: "64px",
            bottom: "138px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {chip ? (
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
                {chip}
              </div>
            </div>
          ) : null}
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
      ...OG_SIZE,
      fonts: [{ name: "NotoJP", data: fontData, weight: 700, style: "normal" }],
    },
  );
}
