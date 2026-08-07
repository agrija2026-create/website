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

export type SubsidyFinderEntryLink = {
  /** 診断ツールのURL。目的や品目を選んだ状態で開く */
  href: string;
  /** 先に選ばれる「やりたいこと」の表示名 */
  purposeLabel?: string;
  /** 先に選ばれる「品目」の表示名 */
  cropLabel?: string;
};

/** 制度マスタに載っている記事からの導線。目的は必ず決まる */
export type SubsidyFinderArticleLink = SubsidyFinderEntryLink & {
  purposeLabel: string;
};

/** `#立場/やりたいこと/品目` の形。選ばせる項目は空にする */
function buildFinderHref(purposeId?: string, cropId?: string): string {
  if (!purposeId && !cropId) return "/tools/subsidy-finder";
  const hash = `/${purposeId ?? ""}${cropId ? `/${cropId}` : ""}`;
  return `/tools/subsidy-finder#${hash}`;
}

function labelOf(options: FinderOption[], id?: string): string | undefined {
  return id ? options.find((o) => o.id === id)?.label : undefined;
}

/**
 * 制度マスタに載っていない記事のうち、診断ツールの入口を出すもの。
 *
 * 2026-08-07 時点の実測で、診断ツールへの導線は制度マスタの記事の記事末だけにあり、
 * その61本は1本あたりのPVが小さい（最大でも週160PV）。一方でサイト流入の大半は
 * 米価・概算金の記事に集まっている（rice-advance-payment-by-region が2週で14,091PV）。
 * 入口が枯れていたのが利用が伸びない主因なので、流入の大きい記事から送る。
 * PV上位は定期的に変わるので、GA4で見直したらこの表を更新する。
 */
const HIGH_TRAFFIC_ENTRY_SLUGS: Record<string, { purposeId?: string; cropId?: string }> = {
  "rice-advance-payment-by-region": { cropId: "rice" },
  "rice-advance-payment": { cropId: "rice" },
  "rice-price-and-policy-overview": { cropId: "rice" },
  "new-paddy-field-policy-r9": { cropId: "rice" },
  "government-stockpiled-rice": { cropId: "rice" },
  "revised-food-supply-act": { cropId: "rice" },
};

/**
 * 制度マスタに載っていない流入の大きい記事から診断ツールへ送る導線。
 * マスタに載っている記事は `getSubsidyFinderArticleLink` が優先されるので、ここでは返さない。
 */
export const getSubsidyFinderEntryLink = cache(
  async (slug: string): Promise<SubsidyFinderEntryLink | null> => {
    const entry = HIGH_TRAFFIC_ENTRY_SLUGS[slug];
    if (!entry) return null;
    if (await getSubsidyFinderArticleLink(slug)) return null;
    return {
      href: buildFinderHref(entry.purposeId, entry.cropId),
      purposeLabel: labelOf(PURPOSE_OPTIONS, entry.purposeId),
      cropLabel: labelOf(CROP_OPTIONS, entry.cropId),
    };
  },
);

/**
 * 診断ツールの入口を出すタグ一覧ページ。タグの意味に合う条件を先に選んだ状態で開く。
 * お金の制度を探しに来た読者が集まるタグと、読者数が最も多い「米」を対象にする。
 */
const TAG_ENTRY_PRESELECTS: Record<string, { purposeId?: string; cropId?: string }> = {
  補助金: {},
  交付金: { purposeId: "crop-payment" },
  "金融・融資": { purposeId: "loan" },
  災害対応: { purposeId: "disaster" },
  就農: { purposeId: "labor" },
  米: { cropId: "rice" },
};

export function getSubsidyFinderTagLink(tagLabel: string): SubsidyFinderEntryLink | null {
  const preselect = TAG_ENTRY_PRESELECTS[tagLabel];
  if (!preselect) return null;
  return {
    href: buildFinderHref(preselect.purposeId, preselect.cropId),
    purposeLabel: labelOf(PURPOSE_OPTIONS, preselect.purposeId),
    cropLabel: labelOf(CROP_OPTIONS, preselect.cropId),
  };
}

/**
 * 制度マスタに載っている記事から診断ツールへ送る導線のリンクを作る。
 * マスタが正なので、記事側のHTMLを1本ずつ編集しなくても導線が付き、
 * マスタから外した制度では自動的に消える。
 */
export const getSubsidyFinderArticleLink = cache(
  async (slug: string): Promise<SubsidyFinderArticleLink | null> => {
    const { programs } = await getSubsidyFinderData();
    const program = programs.find((p) => p.slug === slug);
    if (!program) return null;

    const purposeId = program.purposes[0];
    const purpose = PURPOSE_OPTIONS.find((o) => o.id === purposeId);
    if (!purpose) return null;

    // 品目が1つに決まる制度だけ品目も選んだ状態にする（any や複数は読者に選ばせる）
    const cropId =
      program.crops.length === 1 && program.crops[0] !== "any" ? program.crops[0] : "";
    // 立場は読者ごとに違うので空にする（#/目的/品目 の形）
    const hash = `#/${purposeId}${cropId ? `/${cropId}` : ""}`;
    return { href: `/tools/subsidy-finder${hash}`, purposeLabel: purpose.label };
  },
);
