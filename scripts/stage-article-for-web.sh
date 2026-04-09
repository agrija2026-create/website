#!/usr/bin/env bash
# 確認済みHTMLを WEB 公開用ファイルに反映する
# 使い方:
#   bash scripts/stage-article-for-web.sh <html-path|workdir> <slug> [publishedAt] [category] [tags_csv]
# tags_csv … カンマ区切り。先頭に読者タグ（生産者向け・小売向け・流通向け）を1〜3個含めること。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCE_HTML_DIR="content/source-html"
ARTICLES_DIR="content/articles"

if [[ $# -lt 2 ]]; then
  echo "使い方: bash scripts/stage-article-for-web.sh <html-path|workdir> <slug> [publishedAt] [category] [tags_csv]"
  echo "例1: bash scripts/stage-article-for-web.sh \"../記事/元資料/記事と元資料/foo/foo_解説記事.html\" foo-article"
  echo "例2: bash scripts/stage-article-for-web.sh \"../記事/元資料/記事と元資料/foo\" foo-article"
  exit 1
fi

INPUT_PATH="$1"
SLUG="$2"
PUBLISHED_AT="${3:-$(date +%F)}"
CATEGORY="${4:-policy}"
TAGS_CSV="${5:-生産者向け,maff}"

if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "エラー: slug は英小文字・数字・ハイフンのみで指定してください: ${SLUG}"
  exit 1
fi

if [[ "${INPUT_PATH}" != /* ]]; then
  INPUT_PATH="${PWD}/${INPUT_PATH}"
fi

if [[ -d "${INPUT_PATH}" ]]; then
  shopt -s nullglob
  candidates=("${INPUT_PATH}"/*_解説記事.html)
  shopt -u nullglob
  if [[ ${#candidates[@]} -eq 0 ]]; then
    echo "エラー: フォルダ内に *_解説記事.html が見つかりません: ${INPUT_PATH}"
    exit 1
  fi
  ARTICLE_HTML="${candidates[0]}"
else
  ARTICLE_HTML="${INPUT_PATH}"
fi

if [[ ! -f "${ARTICLE_HTML}" ]]; then
  echo "エラー: HTML が見つかりません: ${ARTICLE_HTML}"
  exit 1
fi

mkdir -p "${SOURCE_HTML_DIR}" "${ARTICLES_DIR}"

TARGET_HTML="${SOURCE_HTML_DIR}/${SLUG}.html"
TARGET_MD="${ARTICLES_DIR}/${SLUG}.md"

cp -f "${ARTICLE_HTML}" "${TARGET_HTML}"

TITLE="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "${ARTICLE_HTML}" | head -n 1)"
if [[ -z "${TITLE}" ]]; then
  TITLE="$(sed -n 's:.*<h1>\(.*\)</h1>.*:\1:p' "${ARTICLE_HTML}" | head -n 1)"
fi
if [[ -z "${TITLE}" ]]; then
  TITLE="記事タイトル"
fi

DESCRIPTION="$(sed -n 's:.*<meta name="description" content="\([^"]*\)".*:\1:p' "${ARTICLE_HTML}" | head -n 1)"
if [[ -z "${DESCRIPTION}" ]]; then
  DESCRIPTION="$(sed -n 's:.*<p class="lead">\([^<]*\)</p>.*:\1:p' "${ARTICLE_HTML}" | head -n 1)"
fi
if [[ -z "${DESCRIPTION}" ]]; then
  DESCRIPTION="${TITLE}の解説記事です。"
fi

yaml_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

TITLE_ESCAPED="$(yaml_escape "$TITLE")"
DESCRIPTION_ESCAPED="$(yaml_escape "$DESCRIPTION")"

IFS=',' read -r -a tag_items <<< "$TAGS_CSV"
tag_block=""
for raw_tag in "${tag_items[@]}"; do
  trimmed="$(printf '%s' "$raw_tag" | sed 's/^ *//; s/ *$//')"
  if [[ -n "$trimmed" ]]; then
    escaped="$(yaml_escape "$trimmed")"
    tag_block="${tag_block}
  - \"${escaped}\""
  fi
done

if [[ -z "$tag_block" ]]; then
  tag_block='
  - "生産者向け"
  - "maff"'
fi

cat > "$TARGET_MD" <<EOF
---
title: "$TITLE_ESCAPED"
slug: "$SLUG"
description: "$DESCRIPTION_ESCAPED"
publishedAt: "$PUBLISHED_AT"
category: "$CATEGORY"
tags:$tag_block
sourceHtmlFile: "content/source-html/$SLUG.html"
---
<!-- 本文は sourceHtmlFile で指定した元HTMLの <article>...</article> を読み込みます -->
EOF

echo "WEB反映用ファイルを作成しました。"
echo "  - HTML: $TARGET_HTML"
echo "  - MD:   $TARGET_MD"
echo ""
echo "確認後の公開:"
echo "  bash scripts/publish-article.sh $SLUG"
