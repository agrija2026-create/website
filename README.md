# 農業情報メディア（nogyo-media）

Next.js 15（App Router）＋ TypeScript ＋ Tailwind CSS v4 で構築した農業情報メディアの静的サイトです。記事本文は `content/articles/*.md` の frontmatter と HTML 本文で管理します。**Git** リモートは **GitHub** を想定しています（Vercel の Git 連携とも相性がよいです）。

**メディア方針・未決バックログ・SEOメモ**は [docs/メディア方針と実装メモ.md](docs/メディア方針と実装メモ.md) にまとめています（実装・運用時の参照用）。

## はじめての公開まで（ほぼ自動）

ターミナルでこのフォルダに移動できる前提です。あなたが用意するのは **名前・メール・GitHub のトークン** だけです（トークンは **GitHub に一度も載せない** でください）。

1. **設定ファイルを作る**（例にコピーして編集）

   ```bash
   cd nogyo-media
   cp setup.secrets.env.example setup.secrets.env
   ```

   `setup.secrets.env` を開き、`GIT_USER_NAME`・`GIT_USER_EMAIL`・`GH_TOKEN` を埋めます。  
   - **GH_TOKEN** … GitHub → Settings → Developer settings → Personal access tokens で作成（リポジトリへの push ができる権限が必要です）。  
   - トークンの代わりに **[GitHub CLI](https://cli.github.com/)** で `gh auth login` 済みなら、`GH_TOKEN` を空にしても push できます。

2. **初回の Git 設定・コミット・GitHub へ push を一括実行**

   ```bash
   npm run setup:first-push
   ```

3. **（任意）Vercel をトークンだけで先に本番に出す**  
   `setup.secrets.env` に `VERCEL_TOKEN=...`（Vercel → Account Settings → Tokens）を追加し:

   ```bash
   npm run setup:vercel
   ```

4. **push のたびに自動で本番更新したい場合**（おすすめ）  
   [Vercel](https://vercel.com) で **New Project** → さきほどの GitHub リポジトリを **Import**（Root Directory は空のまま）。これで **2回目以降は `git push` だけでデプロイ**されます。

**注意**: `setup.secrets.env` は `.gitignore` 済みです。**絶対にコミット・共有しないでください。** 漏れたらトークンはすぐ無効化し、作り直してください。

## 記事化開始→確認→WEB公開（標準フロー）

microCMS は使わず、**ファイルベースのみ**で公開します。

### 0) 元PDFを置く

`記事作成/記事化入力/` に元PDFを置きます。

### 1) チャット指示で記事化開始（またはコマンド）

チャットで「このPDFを記事化開始」と指示するか、`nogyo-media` で次を実行します。

```bash
npm run article:start -- "../記事化入力/<ファイル名>.pdf"
```

実行すると次が作られます。

- `記事/元資料/記事と元資料/<ファイル名>/`
- 同フォルダ内に元PDFコピー
- 同フォルダ内に `<ファイル名>_解説記事.html`（雛形）
- 同フォルダ内に `<ファイル名>_作業メモ.md`

### 2) 記事を作成して確認する

`記事/元資料/記事と元資料/<ファイル名>/<ファイル名>_解説記事.html` を完成させ、内容を確認します。

補足:
- ページ上部の `タイトル / 日付 / タグ / 読了目安 / 目次 / 共有操作` はサイト側で共通表示されます。
- HTML本文側では `<article>` 内に本文を記述し、`<h1>` や先頭 `<header>` は原則不要です（重複表示を避けるため）。
- 記事生成時のルールは [docs/記事生成プロンプト.md](docs/記事生成プロンプト.md) を必ず参照してください。
- **`data:image` / Base64画像 / SVGの data URI はそのまま公開しません**。Google が読む HTML を極端に肥大化させるため、公開時には外部画像へ変換・軽量化します。

### 3) 確認OK後にWEB用ファイルを生成する

```bash
npm run article:stage -- "../記事/元資料/記事と元資料/<ファイル名>" <slug>
```

例:

```bash
npm run article:stage -- "../記事/元資料/記事と元資料/25_物流革新に向けた取組の推進" logistics-innovation-promotion
```

このコマンドで次を作成/更新します。

- `content/source-html/<slug>.html`
- `content/articles/<slug>.md`（`sourceHtmlFile` 参照型）

補足:
- `stage-article-for-web.sh` は、HTML 内の `data:image` やローカル画像を `public/article-images/<slug>/` に書き出し、HTML の `src` を公開用パスへ差し替えます。
- CSS の `url(data:...)` は変換対象外のため、含まれている場合はエラーで停止します。
- 図版そのものは禁止ではありません。禁止しているのは **HTML への画像バイナリ埋め込みを、そのまま公開すること** です。
- **公開図版は PNG を既定**とします（`prepare-article-assets.py`）。AVIF は環境によってデコードされず真っ白になることがあるため、`public/article-images/**/*.avif` と `source-html` 内の `.avif` 参照は **`npm run build` 前の検証で失敗**します。
- **PDF・公式スライドの図版**は、スライド内の一部を切り抜かず、**該当ページ（スライド）を1枚まるごと**画像化して掲載します（1 PDF ページ＝原則 1 画像）。再現用に `scripts/render-pdf-page-to-png.py`（要 `pymupdf`）があります。

### 4) 最後に公開する（手動）

```bash
npm run article:publish -- <slug>
```

`publish-article.sh` は `content/articles/<slug>.md` に加えて、`sourceHtmlFile` が指定されている場合は対応する `content/source-html/*.html` も一緒にコミットして push します。

## ローカルでの起動

```bash
cd nogyo-media
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

本番ビルド:

```bash
npm run build
npm start
```

## Vercel へのデプロイ

1. 本リポジトリを GitHub（または GitLab / Bitbucket）にプッシュします。
2. [Vercel](https://vercel.com) にログインし、「New Project」で該当リポジトリをインポートします。
3. **Root Directory** は、このリポジトリをそのままデプロイする場合は空のまま（または `.`）で問題ありません。親フォルダに複数プロジェクトがあるモノレポのときだけ `nogyo-media` などサブフォルダを指定します。
4. フレームワークは Next.js と自動検出されます。そのままデプロイします。

環境変数は現状のファイルベース記事のみでは不要です。ドメインやプレビュー URL は Vercel のプロジェクト設定から追加できます。

### 初回／2回目以降の整理

| タイミング | あなたがすること | 自動で行われること |
|------------|------------------|---------------------|
| **最初の1回** | 上記「はじめての公開まで」どおり `setup.secrets.env` を用意し、`npm run setup:first-push`。自動デプロイ用に Vercel でリポジトリを Import（または `npm run setup:vercel` で CLI デプロイ）。 | `setup:first-push` がコミットと GitHub への反映まで実行。 |
| **2回目以降** | 記事やコードを直して `git push` するだけ。 | **Vercel** が自動でビルド・本番反映（プルリクならプレビュー URL も自動）。**GitHub Actions**（`.github/workflows/ci.yml`）が `npm run lint` と `npm run build` を実行し、失敗したら赤く表示される。 |
| **依存ライブラリ** | 特に何もしなくてよい（任意で Dependabot の PR をレビューしてマージ）。 | **Dependabot**（`.github/dependabot.yml`）が週1で更新案の PR を出す。 |

GitHub 上のリポジトリの **Actions** タブで、ワークフロー「CI」の成否を確認できます。Vercel のダッシュボードで各デプロイのログも見られます。

## microCMSについて

現在の標準運用では **microCMS を使いません**。  
`content/articles` と `content/source-html` のファイルベース運用で公開します。

microCMS を有効にする場合も、各記事の `tags` に読者タグを1〜3個含めないとビルドに失敗します。

## ディレクトリ概要

- `app/` — App Router のページ・レイアウト
- `components/` — ヘッダー・ヒーロー・カード・サイドバー
- `content/articles/` — 記事 Markdown（frontmatter ＋ HTML 本文）
- `lib/articles.ts` — 記事データ層
- `lib/categories.ts` / `lib/tags.ts` — カテゴリ・読者タグ（`AUDIENCE_TAGS`）・表示用 `TAG_LABELS`

記事の `tags` には **読者タグ**（`生産者向け` / `小売向け` / `流通向け`）を **必ず1〜3個** 含めてください。未設定や個数違反だとビルド時にエラーになります。詳細は [docs/メディア方針と実装メモ.md](docs/メディア方針と実装メモ.md) を参照してください。

## ライセンス

プライベートプロジェクト用。コンテンツの著作権は各出典に従ってください。

