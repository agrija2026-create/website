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

if [[ ! -f "$FILE" ]]; then
  echo "エラー: ${FILE} が見つかりません。"
  exit 1
fi

git add "$FILE"

if git diff --staged --quiet; then
  echo "変更がないため、コミットは作成しません。"
  exit 0
fi

git commit -m "$MESSAGE"
git push

echo "公開完了: ${FILE} を push しました。"
