#!/usr/bin/env bash
# 指定した記事ファイルをコミットして push する
# 使い方:
#   bash scripts/publish-article.sh <slug> [commit-message]
# 例:
#   bash scripts/publish-article.sh smart-agriculture-trend
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

if [[ ! -f "$FILE" ]]; then
  echo "エラー: ${FILE} が見つかりません。"
  exit 1
fi

git add "$FILE"

SOURCE_HTML_FILE="$(sed -n 's/^sourceHtmlFile:[[:space:]]*"\(.*\)".*$/\1/p' "$FILE" | head -n 1 || true)"
if [[ -n "${SOURCE_HTML_FILE}" ]]; then
  if [[ -f "${SOURCE_HTML_FILE}" ]]; then
    git add "${SOURCE_HTML_FILE}"
  else
    echo "警告: sourceHtmlFile が指定されていますが、ファイルが見つかりません: ${SOURCE_HTML_FILE}"
  fi
fi

if git diff --staged --quiet; then
  echo "変更がないため、コミットは作成しません。"
  exit 0
fi

git commit -m "$MESSAGE"
git push

if [[ -n "${SOURCE_HTML_FILE}" ]]; then
  echo "公開完了: ${FILE} と ${SOURCE_HTML_FILE} を push しました。"
else
  echo "公開完了: ${FILE} を push しました。"
fi
