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

公開は **コミット** と **push** の2段階に分かれています。`article:publish` は**コミットまでで止まり、push しません**。

```bash
npm run article:publish -- <slug>   # 1記事=1コミット。push はしない
npm run article:push -- --dry       # 溜まっているコミットの内容を表示（push しない）
npm run article:push                # その日の分をまとめて1回だけ push
```

`publish-article.sh` は `content/articles/<slug>.md` に加えて、`sourceHtmlFile` が指定されている場合は対応する `content/source-html/*.html` も一緒にコミットします。あわせて **記事一覧 CSV**（`public/articles-index.csv`）も再生成してコミットし、最後に未 push のコミット数を表示します。

> **push は1日1回にまとめてください。** Vercel の課金は読者のアクセス量ではなく **push 回数（ビルドCPU時間）** でほぼ決まります（1 push ≈ $0.14、Pro の月間クレジットは $20）。記事を3本出す日も、コミットを3つ積んでから最後に `npm run article:push` を1回だけ実行します。「1記事=1コミット」は revert しやすさのために維持し、**push だけをまとめる**のが原則です。使い切るとサイトが停止します（2026-08-10 に実際に3日22時間停止）。
>
> なお **push を実行してよいのは、ユーザーから「push して」「公開して」と明示的に指示があったときだけ**です。指示がなければコミットまでで止め、「公開待ち」として報告します。

#### push したら、その場で台帳とVercelを確認する

push は「投げて終わり」にしません。**次の2つを push 直後に必ず済ませます。**

1. **本番反映を確認する。** ローカルの `npm run build` が通っても本番に出たとは限りません。クエリを付けないプレーンな本番URLで、記事・図版・sitemap 掲載を確認します（`?cb=` などを付けるとキャッシュやルーティングが変わり「未反映」と誤判定します）。デプロイが数時間生成されないことが実際にあります。
2. **`運営/公開キュー.tsv` の該当行を更新する。** 状態を `承認待ち` → `公開済` にし、`公開コミット` 列にコミットハッシュを入れます。

2 を飛ばすと、**push は済んでいるのに台帳では「承認待ち」のまま**という行が溜まり、次に誰かが見たとき「まだ公開されていない記事」に見えます。2026-08-25 の棚卸しでは、この形のずれが3件見つかりました（うち1件は、コミットされないまま作業ツリーに4日間残っていた変更）。台帳はコミット直後ではなく **push 直後**に更新してください。コミットしただけの段階では、まだ公開されていないためです。

### 記事一覧 CSV（タイトル・URL・公開日）

トップ・新着・カテゴリ・タグのハブページと、全公開記事を **タイトル / URL / 公開日** の3列で出力します（ハブページの公開日列は空）。

| 項目 | 内容 |
|------|------|
| ファイル | `public/articles-index.csv` |
| 本番URL | `https://agri-ja.net/articles-index.csv` |
| 手動更新 | `npm run articles:csv` |

**自動更新のタイミング**

- `npm run article:publish` … 記事 push 時に CSV も同じコミットへ含める
- `npm run build` … Vercel デプロイ前にも再生成（push 忘れがあっても本番 CSV は最新化）

記事の元データは `content/articles/*.md` の frontmatter（`title` / `slug` / `publishedAt`）です。記事 URL は `/articles/<slug>` 形式です。

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

## MCP サーバー（AIエージェント向け公開エンドポイント）

`https://agri-ja.net/mcp` で、記事と公開データを **MCP（Model Context Protocol）** のツールとして提供しています。実体は [app/mcp/route.ts](app/mcp/route.ts) の1ファイルだけです。

- 読み取り専用・認証なし。MCP 2026-07-28（ステートレス）と 2025 系 Streamable HTTP の両方を同じURLで受けます。
- ツールは4つ: `search_articles` / `get_article` / `rice_advance_payment` / `find_subsidy`
- 記事本文は全文を返さず「要点＋冒頭抜粋＋URL」に留めます。AIの回答に出典URLが載り、読者がサイトに来られる状態を保つためです。
- データ源は記事とサイト内ツールと同じ（`content/`）。記事を publish すればMCP側も自動で最新になります。
- `/mcp` は実行時に `content/` を読む唯一のルートなので、`next.config.ts` の `outputFileTracingIncludes` から外さないでください（外すと本番で ENOENT）。

**利用のしかた（案内するとき）**: Claude / ChatGPT / Cursor の「カスタムコネクタ」に `https://agri-ja.net/mcp` を登録するだけです。所在は [/llms.txt](app/llms.txt/route.ts) でも告知しています。

**計測**: MCP経由の利用は GA4 にも Search Console にも映りません。Vercel の Function Logs に出る `[mcp] <method> <status> <ms>` が唯一の計測点です。

### 公式レジストリ（registry.modelcontextprotocol.io）

`net.agri-ja/agri-ja` として登録済み（2026-08-07・status active）。名前空間は GitHub ではなく **agri-ja.net のドメイン認証（HTTP方式）** で取っています。

- 公開鍵: `public/mcp-registry-auth` → `next.config.ts` の rewrites で `/.well-known/mcp-registry-auth` として配信（**Vercel は `public/` 配下のドットディレクトリを配信しないため**、`public/.well-known/` に直接置くと本番で404になります）
- 秘密鍵: `~/.config/mcp-registry/agri-ja-key.pem` と `agri-ja-privkey.hex`（**リポジトリ外。コミットしない**）
- CLI: `~/.local/bin/mcp-publisher`

ツールを追加・変更したら `server.json` の `version` を上げて再公開します:

```bash
cd nogyo-media
~/.local/bin/mcp-publisher validate
~/.local/bin/mcp-publisher login http --domain agri-ja.net --private-key "$(cat ~/.config/mcp-registry/agri-ja-privkey.hex)"
~/.local/bin/mcp-publisher publish
curl -s "https://registry.modelcontextprotocol.io/v0.1/servers?search=agri-ja"
```

動作確認（ローカル）:

```bash
curl -s -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## ディレクトリ概要

- `app/` — App Router のページ・レイアウト
- `components/` — ヘッダー・ヒーロー・カード・サイドバー
- `content/articles/` — 記事 Markdown（frontmatter ＋ HTML 本文）
- `lib/articles.ts` — 記事データ層
- `lib/categories.ts` / `lib/tags.ts` — カテゴリ・読者タグ・テーマタグ正規語彙（`THEME_TAG_REGISTRY`）

記事の `tags` には **読者タグ**（`生産者向け` / `小売向け` / `流通向け` / `消費者向け`）を **必ず1〜3個** 含めてください。テーマタグは [docs/theme-tags.md](docs/theme-tags.md) の正規語彙から **0〜3個** 付けます。未登録タグや読者タグ個数違反はビルド時にエラーになります。

新規記事のテーマタグ提案: `python3 scripts/suggest-theme-tags.py <slug> <category>`

## ライセンス

プライベートプロジェクト用。コンテンツの著作権は各出典に従ってください。

