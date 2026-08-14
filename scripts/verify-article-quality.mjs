#!/usr/bin/env node
/**
 * verify-article-quality.mjs — 公開前の機械品質チェック（自律運用の必須ゲート）
 *
 * 使い方:
 *   node scripts/verify-article-quality.mjs <slug> [slug...]
 *   npm run article:verify -- <slug>
 *
 * 検査対象: content/articles/<slug>.md と content/source-html/<slug>.html
 * 出力: 人間可読のサマリー＋ JSON（--json 指定時は JSON のみ）
 * 終了コード: error が1件でもあれば 1（公開ブロック）。warn のみなら 0（日報に転記）。
 *
 * 判定基準の由来: .cursor/rules/article-html-web-format.mdc、
 * .cursor/skills/pdf-kisetu-article/SKILL.md の完了前チェックリスト、
 * article-web-publish の takeaways 重複対策。しきい値の変更はユーザー合意の上で
 * （運営ポリシー.md「しきい値・分析スクリプトの変更＝承認必須」）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// タイトルに年号（令和N年/R N）が入ってよい「生きたページ」（運営ポリシー.md §4 と対応）
const LIVING_PAGE_SLUGS = new Set([
  'rice-advance-payment',
  'rice-advance-payment-by-region',
  'pest-disease-forecast-r8-issue-1',
  'vegetable-price-outlook',
]);

function readFileOrNull(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

// --- タグ語彙は lib/tags.ts を唯一の正本として読む（ここに二重定義しない） ---
// 2026-08-10 追加: 未登録のテーマタグ（例「食の安全」）は lib/tags.ts の
// validateArticleThemeTags が例外を投げ、記事ページだけでなくトップ・一覧・タグページまで
// 巻き込んで 500 になる。従来この検証はビルド任せで verify を素通りしていた。
const TAGS_TS = path.join(ROOT, 'lib/tags.ts');
const MAX_AUDIENCE_TAGS = 3;
const MAX_THEME_TAGS = 3;

function loadTagVocabulary() {
  const src = readFileOrNull(TAGS_TS);
  if (!src) return null;
  // 宣言に固定する（同名の文字列がコメントや型定義にも出るため、先頭 export const で錨を打つ）
  const audienceBlock = src.match(/export const AUDIENCE_TAGS[^=]*=\s*\[([\s\S]*?)\n\]/);
  const themeBlock = src.match(/export const THEME_TAG_REGISTRY[^=]*=\s*\[([\s\S]*?)\n\]/);
  if (!audienceBlock || !themeBlock) return null;
  const audience = [...audienceBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const theme = [...themeBlock[1].matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (audience.length === 0 || theme.length === 0) return null;
  return { audience: new Set(audience), theme: new Set(theme), themeList: theme };
}

const TAG_VOCAB = loadTagVocabulary();

// --- frontmatter の素朴なパース（YAMLライブラリ非依存。この repo の frontmatter 構造に限定） ---
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const get = (key) => {
    const r = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm'));
    return r ? r[1].trim() : null;
  };
  const getList = (key) => {
    const r = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)+)`, 'm'));
    if (!r) return null;
    return r[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  };
  return {
    title: get('title'),
    description: get('description'),
    publishedAt: get('publishedAt'),
    updatedAt: get('updatedAt'),
    category: get('category'),
    sourceHtmlFile: get('sourceHtmlFile'),
    tags: getList('tags') ?? [],
    takeaways: getList('takeaways') ?? [],
    hasReadingMinutes: /^readingMinutes:/m.test(fm),
  };
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ');
}

function extractArticle(html) {
  const m = html.match(/<article[\s\S]*<\/article>/);
  return m ? m[0] : html;
}

// 表ごとの最大列数を返す。article-data-table（多列比較表の公認クラス・横スクロール対応）と
// それ以外を区別する（2026-08-05 校正: data-table の5列以上は警告、無印の5列以上はエラー）
function tableColumnStats(html) {
  let maxPlain = 0;
  let maxDataTable = 0;
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  for (const t of tables) {
    const isDataTable = /class="[^"]*article-data-table/.test(t);
    let max = 0;
    const rows = t.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    for (const row of rows) {
      let cols = 0;
      const cells = row.match(/<t[dh][^>]*>/gi) ?? [];
      for (const c of cells) {
        const span = c.match(/colspan="?(\d+)"?/i);
        cols += span ? parseInt(span[1], 10) : 1;
      }
      if (cols > max) max = cols;
    }
    if (isDataTable) maxDataTable = Math.max(maxDataTable, max);
    else maxPlain = Math.max(maxPlain, max);
  }
  return { maxPlain, maxDataTable };
}

function checkArticle(slug) {
  const errors = [];
  const warns = [];
  const err = (rule, detail) => errors.push({ rule, detail });
  const warn = (rule, detail) => warns.push({ rule, detail });

  const mdPath = path.join(ROOT, 'content/articles', `${slug}.md`);
  const htmlPath = path.join(ROOT, 'content/source-html', `${slug}.html`);
  const md = readFileOrNull(mdPath);
  const html = readFileOrNull(htmlPath);

  if (!md) err('file-missing', `content/articles/${slug}.md が存在しない`);
  if (!html) err('file-missing', `content/source-html/${slug}.html が存在しない`);
  if (!md || !html) return { slug, errors, warns };

  const fm = parseFrontmatter(md);
  if (!fm) {
    err('frontmatter', 'frontmatter をパースできない');
    return { slug, errors, warns };
  }

  // --- .md 側 ---
  if (!fm.title) err('frontmatter', 'title がない');
  if (!fm.description) err('frontmatter', 'description がない');
  // 2〜4が標準（チェックリスト）。公開実績のある記事に5〜6項目が存在するため、5〜6は警告・それ以外はエラー。
  // 生きたページ（データハブ）は意図的に項目が多いため警告どまり（2026-08-05 校正）
  const isLiving = LIVING_PAGE_SLUGS.has(slug);
  if (!isLiving && (fm.takeaways.length < 2 || fm.takeaways.length > 6)) {
    err('takeaways-count', `takeaways が ${fm.takeaways.length} 項目（2〜4が標準・最大6）`);
  } else if (fm.takeaways.length < 2 || fm.takeaways.length > 4) {
    warn('takeaways-count', `takeaways が ${fm.takeaways.length} 項目（標準は2〜4。新規記事は4以下に）`);
  }
  // --- タグ（読者タグ 1〜3 必須／テーマタグ 0〜3・語彙は lib/tags.ts が正本） ---
  // 未登録タグはビルド・dev の両方で例外になり、記事だけでなくトップ・一覧・タグページも
  // 500 に巻き込む。verify で止める（2026-08-10 追加。ユーザー承認済み）。
  if (fm.tags.length < 1) {
    err('tags', '読者タグが1つもない（1〜3必須）');
  } else if (!TAG_VOCAB) {
    warn('tags-vocabulary', 'lib/tags.ts からタグ語彙を読めなかったため語彙検証をスキップした（実装変更の可能性）');
  } else {
    const audience = fm.tags.filter((t) => TAG_VOCAB.audience.has(t));
    const theme = fm.tags.filter((t) => TAG_VOCAB.theme.has(t));
    const unknown = fm.tags.filter((t) => !TAG_VOCAB.audience.has(t) && !TAG_VOCAB.theme.has(t));
    for (const t of unknown) {
      err(
        'tags-vocabulary',
        `未登録のタグ「${t}」（lib/tags.ts に無い。ビルドと dev が例外を投げ、記事・トップ・一覧・タグページが 500 になる）。テーマタグの正規語彙: ${TAG_VOCAB.themeList.join('/')}`,
      );
    }
    if (audience.length < 1) {
      err('tags-audience', `読者タグがない（${[...TAG_VOCAB.audience].join('/')} から1〜3個）`);
    } else if (audience.length > MAX_AUDIENCE_TAGS) {
      err('tags-audience', `読者タグが ${audience.length} 個（1〜${MAX_AUDIENCE_TAGS}個）`);
    }
    if (theme.length > MAX_THEME_TAGS) {
      err('tags-theme', `テーマタグが ${theme.length} 個（0〜${MAX_THEME_TAGS}個）`);
    } else if (theme.length === 0) {
      // theme-tags.mdc: 関連記事の自動グルーピングに使うため公開時に最低1つ付ける
      warn('tags-theme', 'テーマタグが0個（関連記事の自動グルーピングが効かずカテゴリ任せになる。公開時は最低1つ付ける）');
    }
  }
  if (fm.hasReadingMinutes) {
    err('reading-minutes', 'frontmatter に readingMinutes を手書きしている（自動算出式を上書きするため禁止）');
  }
  if (fm.description) {
    const len = [...fm.description].length;
    if (len < 50) err('description-length', `description が ${len} 字（短すぎ。目安80〜120字）`);
    else if (len > 250) err('description-length', `description が ${len} 字（長すぎ。目安80〜120字）`);
    else if (len < 80 || len > 120) warn('description-length', `description が ${len} 字（目安80〜120字の範囲外）`);
  }

  // --- source-html 側 ---
  const article = extractArticle(html);
  const visible = stripTags(article);

  if (/class="[^"]*article-takeaways/.test(article)) {
    err('takeaways-duplicate', 'source-html に section.article-takeaways が残っている（frontmatter takeaways と二重表示になる）');
  }
  if (!/<p class="lead">/.test(article)) {
    err('lead-missing', 'p.lead がない（header 直後は p.lead で始める）');
  }
  if (/src="data:image|;base64,/.test(article)) {
    err('data-uri', 'data:image / Base64 画像が埋め込まれている（外部画像ファイルにする）');
  }
  const { maxPlain, maxDataTable } = tableColumnStats(article);
  if (maxPlain >= 5) {
    err('table-columns', `article-data-table でない表に列数 ${maxPlain} がある（5列以上は article-data-table にするか分割）`);
  }
  if (maxDataTable >= 7) {
    warn('table-columns', `article-data-table に列数 ${maxDataTable} がある（横スクロールでも読みにくい可能性）`);
  }
  const footerMatch = article.match(/<footer[^>]*class="[^"]*\bsource\b[^"]*"[^>]*>[\s\S]*?<\/footer>/);
  if (!footerMatch) {
    err('footer-source', 'footer.source がない（公的出典名とURLを明示する）');
  } else if (!/<a\s[^>]*href="https?:\/\//.test(footerMatch[0])) {
    err('footer-source', 'footer.source に出典URLのリンクがない');
  }
  if (/（PDF[：:]\s*[\w-]+）|\b(?:index|jirei|seibi|attach)-\d+\b/.test(visible)) {
    err('pdf-basename', '本文の表示文言に元PDFのファイル名らしき文字列がある（資料の正式名で書く。hrefに含まれるのは可）');
  }

  // 内部リンク（本文中の /articles/ へのリンク）
  const internal = (article.match(/href="(?:https:\/\/agri-ja\.net)?\/articles\/[a-z0-9-]+/g) ?? []).length;
  if (internal === 0) warn('internal-links', '本文に内部リンクが0本（文脈に合うリンク1〜3本が目安。適切な先が無い場合は作業メモに理由）');

  // FAQ 構造（FAQPage 構造化データの型）
  if (/<h2 id="faq"/.test(article)) {
    const faqSection = article.slice(article.indexOf('<h2 id="faq"'));
    const h3Count = (faqSection.match(/<h3[\s>]/g) ?? []).length;
    if (h3Count < 2) warn('faq-structure', `FAQ節の h3（質問）が ${h3Count} 組（2組以上で FAQPage 構造化データが生成される）`);
  }

  // 文体（禁止語・AIっぽさの機械検出可能分）
  if (/——|――/.test(visible)) warn('double-dash', '二重ダッシュ（——/――）がある（2026-07-15 全面禁止）');
  for (const phrase of ['資料によれば', '本資料では', 'スライドでは', 'に委ねてください']) {
    if (visible.includes(phrase)) warn('forbidden-phrase', `禁止表現「${phrase}」がある`);
  }
  if (/[お問い合わせ先|問い合わせ先]{5,}<\/h[23]>/.test(article) || /<h[23][^>]*>お問い合わせ先/.test(article)) {
    warn('contact-section', 'お問い合わせ先セクションらしき見出しがある（ルール禁止）');
  }

  // title / h1 / 年号
  const titleTag = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  const h1 = article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
  if (titleTag && h1 && titleTag !== h1) warn('title-h1', `<title> と <h1> が不一致（title="${titleTag}" / h1="${h1}"）`);
  if (fm.title && titleTag && fm.title !== titleTag) warn('title-md', 'frontmatter title と <title> が不一致');
  if (!LIVING_PAGE_SLUGS.has(slug) && fm.title && /令和\d+年|20\d{2}年産/.test(fm.title)) {
    warn('title-year', 'タイトルに年号がある（生きたページ以外は原則入れない。確定データの年次は本文初出1箇所）');
  }

  return { slug, errors, warns };
}

// --- main ---
const args = process.argv.slice(2).filter((a) => a !== '--json');
const jsonOnly = process.argv.includes('--json');
if (args.length === 0) {
  console.error('使い方: node scripts/verify-article-quality.mjs <slug> [slug...] [--json]');
  process.exit(2);
}

const results = args.map(checkArticle);
const totalErrors = results.reduce((n, r) => n + r.errors.length, 0);

if (jsonOnly) {
  console.log(JSON.stringify({ results, totalErrors }, null, 2));
} else {
  for (const r of results) {
    const status = r.errors.length ? '❌ ERROR' : r.warns.length ? '⚠️  WARN' : '✅ OK';
    console.log(`\n${status}  ${r.slug}  (error ${r.errors.length} / warn ${r.warns.length})`);
    for (const e of r.errors) console.log(`  [error] ${e.rule}: ${e.detail}`);
    for (const w of r.warns) console.log(`  [warn]  ${w.rule}: ${w.detail}`);
  }
  console.log(`\n合計: error ${totalErrors} / warn ${results.reduce((n, r) => n + r.warns.length, 0)}（error>0 は公開ブロック）`);
}
process.exit(totalErrors > 0 ? 1 : 0);
