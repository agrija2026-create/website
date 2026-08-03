import type { ArticleMeta } from "@/lib/articles";

export type XFollowCtaCopy = {
  heading: string;
  body: string;
  variant: string;
};

/**
 * 記事の性質に合わせた X フォロー導線の文面。
 * 「何の続報が届くのか」が具体的なほど押されるため、テーマ別に約束を変える。
 */
export function buildXFollowCtaCopy(article: ArticleMeta): XFollowCtaCopy {
  const tags = new Set([...article.tags, ...article.themeTags]);

  if (tags.has("米") || article.slug.startsWith("rice-")) {
    return {
      variant: "rice",
      heading: "米価・概算金の続報は X でお知らせします",
      body: "産地ごとの概算金は8月下旬から9月にかけて順次示されます。新しい金額を確認したら記事を更新し、X で告知します。",
    };
  }

  if (tags.has("補助金") || tags.has("交付金") || article.category === "budget") {
    return {
      variant: "subsidy",
      heading: "補助金の公募開始・締切は X でお知らせします",
      body: "公募の開始や締切の前倒しは見落としやすいものです。新しい情報が出たときに投稿しています。",
    };
  }

  if (tags.has("災害対応")) {
    return {
      variant: "disaster",
      heading: "被害時に使える支援の新着は X でお知らせします",
      body: "災害ごとに発動される支援は、公表から申請までの期間が短いことがあります。動きがあれば投稿します。",
    };
  }

  return {
    variant: "general",
    heading: "農政の新しい発表は X でお知らせします",
    body: "農林水産省の公表資料をもとに、制度の変更や締切の動きを投稿しています。見逃したくない方はフォローしてください。",
  };
}
