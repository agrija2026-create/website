# 農業情報メディア（nogyo-media）

Next.js 15（App Router）＋ TypeScript ＋ Tailwind CSS v4 で構築した農業情報メディアの静的サイトです。記事本文は `content/articles/*.md` の frontmatter と HTML 本文で管理します。**Git** リモートは **GitHub** を想定しています（Vercel の Git 連携とも相性がよいです）。

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

## microCMS へ差し替えるとき

- **差し替えの中心**: [`lib/articles.ts`](lib/articles.ts)  
  ここで `getAllArticles` / `getArticleBySlug` / `getArticlesByCategory` / `getArticlesByTag` / `getRecentArticles` / `getAllTagSlugs` を、CMS の API 取得に置き換えます。各ページ・コンポーネントはこのモジュールのみを参照する想定です。

- **想定する環境変数**（例）:

  | 変数名 | 用途 |
  |--------|------|
  | `MICROCMS_SERVICE_DOMAIN` | microCMS のサービスドメイン（API エンドポイント用） |
  | `MICROCMS_API_KEY` | 取得用 API キー |

取得結果を同じ `Article` / `ArticleMeta` 形にマッピングすると、UI 側の変更を最小にできます。

## ディレクトリ概要

- `app/` — App Router のページ・レイアウト
- `components/` — ヘッダー・ヒーロー・カード・サイドバー
- `content/articles/` — 記事 Markdown（frontmatter ＋ HTML 本文）
- `lib/articles.ts` — 記事データ層
- `lib/categories.ts` / `lib/tags.ts` — カテゴリ・タグのマスタ

## ライセンス

プライベートプロジェクト用。コンテンツの著作権は各出典に従ってください。

