#!/usr/bin/env bash
# 指定した記事ファイルを「コミットまで」行う（既定では push しない）
#
# 使い方:
#   bash scripts/publish-article.sh <slug> [commit-message]      # コミットのみ
#   PUSH=1 bash scripts/publish-article.sh <slug> [message]      # コミット＋push（非推奨）
#
# なぜ push しないか（2026-08-14 ユーザー指示・運営ポリシー §0）:
#   Vercel の課金は読者のアクセス量ではなく push 回数（ビルドCPU時間）でほぼ決まる。
#   1 push ≈ $0.14 で Pro の月間クレジットは $20。記事ごとに push すると月内に
#   使い切ってサイトが停止する（2026-08-10 に実際に3日22時間停止）。
#   その日の分をコミットで積み上げ、最後に 1 回だけ `npm run article:push` する。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "使い方: bash scripts/publish-article.sh <slug> [commit-message]"
  exit 1
fi

SLUG="$1"
MESSAGE="${2:-content: add/update article ${SLUG}}"
FILE="content/articles/${SLUG}.md"
SOURCE_HTML_FILE=""
PUBLIC_IMAGE_DIR="public/article-images/${SLUG}"

if [[ ! -f "$FILE" ]]; then
  echo "エラー: ${FILE} が見つかりません。"
  exit 1
fi

git add "$FILE"

npm run articles:csv
git add public/articles-index.csv

npm run sitemap:generate
git add public/sitemap.xml

SOURCE_HTML_FILE="$(sed -n 's/^sourceHtmlFile:[[:space:]]*"\(.*\)".*$/\1/p' "$FILE" | head -n 1 || true)"
if [[ -n "${SOURCE_HTML_FILE}" ]]; then
  if [[ -f "${SOURCE_HTML_FILE}" ]]; then
    git add "${SOURCE_HTML_FILE}"
  else
    echo "警告: sourceHtmlFile が指定されていますが、ファイルが見つかりません: ${SOURCE_HTML_FILE}"
  fi
fi

if [[ -d "${PUBLIC_IMAGE_DIR}" ]]; then
  git add "${PUBLIC_IMAGE_DIR}"
fi

if git diff --staged --quiet; then
  echo "変更がないため、コミットは作成しません。"
  exit 0
fi

git commit -m "$MESSAGE"

COMMITTED="${FILE}"
[[ -n "${SOURCE_HTML_FILE}" ]] && COMMITTED="${COMMITTED}、${SOURCE_HTML_FILE}"
[[ -d "${PUBLIC_IMAGE_DIR}" ]] && COMMITTED="${COMMITTED}、${PUBLIC_IMAGE_DIR}"

if [[ "${PUSH:-0}" == "1" ]]; then
  git push
  echo "公開完了: ${COMMITTED} を push しました。"
  exit 0
fi

echo "コミット完了: ${COMMITTED}"
echo

git fetch --quiet origin || true
PENDING="$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')"
echo "未pushのコミット: ${PENDING} 件"
git log --oneline origin/main..HEAD 2>/dev/null | sed 's/^/  /' || true
echo
echo "※ push はまだしていません（運営ポリシー §0: push はユーザーの明示指示があるときだけ・1日1回）。"
echo "   その日の分をすべてコミットし終えたら、最後に1回だけ:  npm run article:push"
