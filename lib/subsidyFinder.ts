import fs from "fs";
import path from "path";
import { cache } from "react";
import { getAllArticles } from "@/lib/articles";

export type FinderOption = {
  id: string;
  label: string;
  hint: string;
};

/** 立場 */
export const AUDIENCE_OPTIONS: FinderOption[] = [
  {
    id: "new-farmer",
    label: "これから始める・就農して間もない",
    hint: "研修中、就農5年目まで、親元就農・第三者継承を含む",
  },
  {
    id: "individual",
    label: "個人・家族で経営している",
    hint: "認定農業者を含む個人経営",
  },
  {
    id: "corporation",
    label: "法人で経営している",
    hint: "農業法人、雇用のある経営体",
  },
  {
    id: "community",
    label: "集落営農・JA・協議会",
    hint: "地域や産地で共同して取り組む組織",
  },
];

/** やりたいこと */
export const PURPOSE_OPTIONS: FinderOption[] = [
  { id: "machine", label: "機械を買う・更新する", hint: "トラクター、スマート農機、共同利用" },
  { id: "facility", label: "施設・ハウスを建てる", hint: "ハウス、畜舎、集出荷・貯蔵施設" },
  { id: "loan", label: "お金を借りる", hint: "制度資金、無利子・低利の融資" },
  { id: "risk", label: "収入減・価格下落に備える", hint: "収入保険、共済、価格安定" },
  { id: "scale", label: "規模を広げる・農地を増やす", hint: "農地の集積、荒廃農地の再生" },
  { id: "environment", label: "環境・有機に取り組む", hint: "有機転換、堆肥・緑肥、省エネ" },
  { id: "disaster", label: "被災から立て直す", hint: "台風・大雨で壊れた施設や農機の再建" },
  { id: "sales", label: "売り先を広げる・輸出・加工", hint: "6次化、販路開拓、輸出向け整備" },
  { id: "labor", label: "人を雇う・育てる・継ぐ", hint: "雇用就農、研修、経営継承" },
  { id: "crop-payment", label: "作物ごとの交付金を受け取る", hint: "水活、ゲタ、改植の支援単価" },
];

/** 品目 */
export const CROP_OPTIONS: FinderOption[] = [
  { id: "rice", label: "米・水田", hint: "主食用米、転作を含む" },
  { id: "vegetable", label: "野菜", hint: "露地・施設園芸" },
  { id: "fruit", label: "果樹", hint: "かんきつ、りんご、ぶどうなど" },
  { id: "livestock", label: "畜産", hint: "酪農、肉用牛、養豚、養鶏" },
  { id: "flower", label: "花き", hint: "切り花、鉢物" },
  { id: "field-crop", label: "麦・大豆・畑作", hint: "そば、なたね、いも類、てん菜など" },
  { id: "other", label: "その他・複合", hint: "茶、きのこ、薬用作物、複数品目" },
];

export type SubsidyProgram = {
  slug: string;
  title: string;
  description: string;
  keyPoint: string;
  audiences: string[];
  purposes: string[];
  crops: string[];
};

export type SubsidyFinderData = {
  programs: SubsidyProgram[];
  /** 条件に関わらず最後に案内する記事（補助金ハブ・認定農業者・eMAFF） */
  alwaysShow: { slug: string; title: string; description: string }[];
};

type MasterEntry = {
  slug: string;
  keyPoint: string;
  audiences: string[];
  purposes: string[];
  crops: string[];
};

const MASTER_PATH = path.join(process.cwd(), "content/tools/subsidy-finder.json");

const VALID_AUDIENCES = new Set(AUDIENCE_OPTIONS.map((o) => o.id));
const VALID_PURPOSES = new Set(PURPOSE_OPTIONS.map((o) => o.id));
const VALID_CROPS = new Set([...CROP_OPTIONS.map((o) => o.id), "any"]);

/** 分類の打ち間違いは黙って結果が減るだけで気づけないので、ビルドで止める */
function validate(entry: MasterEntry) {
  const bad = [
    ...entry.audiences.filter((a) => !VALID_AUDIENCES.has(a)),
    ...entry.purposes.filter((p) => !VALID_PURPOSES.has(p)),
    ...entry.crops.filter((c) => !VALID_CROPS.has(c)),
  ];
  if (bad.length > 0) {
    throw new Error(
      `subsidy-finder.json: ${entry.slug} に未知の分類があります: ${bad.join(", ")}`,
    );
  }
  if (entry.audiences.length === 0 || entry.purposes.length === 0) {
    throw new Error(
      `subsidy-finder.json: ${entry.slug} は audiences と purposes を1つ以上指定してください`,
    );
  }
}

/**
 * 制度マスタと記事を突き合わせる。タイトル・説明は記事側を正とし、
 * 記事が消えた（未公開の）slug は候補から落とす（リンク切れを出さない）。
 */
export const getSubsidyFinderData = cache(async (): Promise<SubsidyFinderData> => {
  const master = JSON.parse(await fs.promises.readFile(MASTER_PATH, "utf8")) as {
    alwaysShow: string[];
    programs: MasterEntry[];
  };
  const articles = await getAllArticles();
  const bySlug = new Map(articles.map((a) => [a.slug, a]));

  const programs: SubsidyProgram[] = [];
  const missing: string[] = [];
  for (const entry of master.programs) {
    validate(entry);
    const article = bySlug.get(entry.slug);
    if (!article) {
      missing.push(entry.slug);
      continue;
    }
    programs.push({
      slug: entry.slug,
      title: article.title,
      description: article.description,
      keyPoint: entry.keyPoint,
      audiences: entry.audiences,
      purposes: entry.purposes,
      crops: entry.crops,
    });
  }
  if (missing.length > 0) {
    console.warn(
      `[subsidy-finder] 記事が見つからない slug を除外しました: ${missing.join(", ")}`,
    );
  }

  const alwaysShow = master.alwaysShow
    .map((slug) => bySlug.get(slug))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({ slug: a.slug, title: a.title, description: a.description }));

  return { programs, alwaysShow };
});
