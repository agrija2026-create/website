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
HAS_PUBLISHED_AT=0
HAS_CATEGORY=0
HAS_TAGS=0
if [[ $# -ge 3 ]]; then
  HAS_PUBLISHED_AT=1
fi
if [[ $# -ge 4 ]]; then
  HAS_CATEGORY=1
fi
if [[ $# -ge 5 ]]; then
  HAS_TAGS=1
fi
PUBLISHED_AT_INPUT="${3:-}"
CATEGORY_INPUT="${4:-}"
TAGS_CSV_INPUT="${5:-}"

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

python3 "scripts/prepare-article-assets.py" \
  --input "${ARTICLE_HTML}" \
  --output "${TARGET_HTML}" \
  --slug "${SLUG}"

HTML_BYTES="$(wc -c < "${TARGET_HTML}" | tr -d '[:space:]')"
if [[ "${HTML_BYTES}" -gt 1500000 ]]; then
  echo "警告: 変換後の HTML ファイルサイズが大きいです (${HTML_BYTES} bytes)。"
  echo "  - 本文の表や図版点数が多すぎないか確認してください。"
  echo "  - Google が読む HTML を軽く保つため、可能なら 1.5MB 未満を目安にしてください。"
fi

TITLE="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "${TARGET_HTML}" | head -n 1)"
if [[ -z "${TITLE}" ]]; then
  TITLE="$(sed -n 's:.*<h1>\(.*\)</h1>.*:\1:p' "${TARGET_HTML}" | head -n 1)"
fi
if [[ -z "${TITLE}" ]]; then
  TITLE="記事タイトル"
fi

DESCRIPTION="$(sed -n 's:.*<meta name="description" content="\([^"]*\)".*:\1:p' "${TARGET_HTML}" | head -n 1)"
if [[ -z "${DESCRIPTION}" ]]; then
  DESCRIPTION="$(sed -n 's:.*<p class="lead">\([^<]*\)</p>.*:\1:p' "${TARGET_HTML}" | head -n 1)"
fi
if [[ -z "${DESCRIPTION}" ]]; then
  DESCRIPTION="${TITLE}の解説記事です。"
fi

TARGET_MD="$TARGET_MD" \
SLUG="$SLUG" \
TITLE="$TITLE" \
DESCRIPTION="$DESCRIPTION" \
CURRENT_DATE="$(date +%F)" \
HAS_PUBLISHED_AT="$HAS_PUBLISHED_AT" \
HAS_CATEGORY="$HAS_CATEGORY" \
HAS_TAGS="$HAS_TAGS" \
PUBLISHED_AT_INPUT="$PUBLISHED_AT_INPUT" \
CATEGORY_INPUT="$CATEGORY_INPUT" \
TAGS_CSV_INPUT="$TAGS_CSV_INPUT" \
python3 <<'PY'
from __future__ import annotations

import os
import re
from pathlib import Path

DEFAULT_PUBLISHED_AT = os.environ["CURRENT_DATE"]
DEFAULT_CATEGORY = "policy"
DEFAULT_TAGS = ["生産者向け", "maff"]
DEFAULT_BODY = "<!-- 本文は sourceHtmlFile で指定した元HTMLの <article>...</article> を読み込みます -->\n"

target_md = Path(os.environ["TARGET_MD"])
slug = os.environ["SLUG"]
title = os.environ["TITLE"]
description = os.environ["DESCRIPTION"]
has_published_at = os.environ["HAS_PUBLISHED_AT"] == "1"
has_category = os.environ["HAS_CATEGORY"] == "1"
has_tags = os.environ["HAS_TAGS"] == "1"
published_at_input = os.environ["PUBLISHED_AT_INPUT"]
category_input = os.environ["CATEGORY_INPUT"]
tags_csv_input = os.environ["TAGS_CSV_INPUT"]


def split_frontmatter(text: str) -> tuple[list[dict[str, object]], str]:
    if not text.startswith("---\n"):
        return [], text
    match = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not match:
        return [], text
    return parse_frontmatter(match.group(1)), text[match.end() :]


def parse_frontmatter(frontmatter: str) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    lines = frontmatter.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        match = re.match(r"^([A-Za-z0-9_]+):(?:\s*(.*))?$", line)
        if not match:
            index += 1
            continue
        key = match.group(1)
        rest = match.group(2) or ""
        if rest == "":
            values: list[str] = []
            raw_lines = [line]
            index += 1
            while index < len(lines):
                nested = lines[index]
                nested_match = re.match(r'^  -\s*(.*)$', nested)
                if nested_match:
                    values.append(parse_scalar(nested_match.group(1)))
                    raw_lines.append(nested)
                    index += 1
                    continue
                if not nested.strip():
                    raw_lines.append(nested)
                    index += 1
                    continue
                break
            items.append({"key": key, "value": values, "raw_lines": raw_lines})
            continue
        items.append({"key": key, "value": parse_scalar(rest), "raw_lines": [line]})
        index += 1
    return items


def parse_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
        inner = value[1:-1]
        return inner.replace(r"\\", "\\").replace(r"\"", '"')
    return value


def yaml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', r"\"") + '"'


def render_scalar_entry(key: str, value: str) -> list[str]:
    return [f"{key}: {yaml_quote(value)}"]


def render_list_entry(key: str, values: list[str]) -> list[str]:
    lines = [f"{key}:"]
    for item in values:
        lines.append(f"  - {yaml_quote(str(item))}")
    return lines


existing_items: list[dict[str, object]] = []
existing_body = ""
if target_md.exists():
    existing_items, existing_body = split_frontmatter(target_md.read_text(encoding="utf-8"))

existing_map = {entry["key"]: entry for entry in existing_items}

if has_published_at:
    published_at = published_at_input.strip() or DEFAULT_PUBLISHED_AT
else:
    published_at = str(existing_map.get("publishedAt", {}).get("value") or DEFAULT_PUBLISHED_AT)

if has_category:
    category = category_input.strip() or DEFAULT_CATEGORY
else:
    category = str(existing_map.get("category", {}).get("value") or DEFAULT_CATEGORY)

if has_tags:
    tags = [tag.strip() for tag in tags_csv_input.split(",") if tag.strip()]
else:
    existing_tags = existing_map.get("tags", {}).get("value")
    tags = list(existing_tags) if isinstance(existing_tags, list) and existing_tags else list(DEFAULT_TAGS)
if not tags:
    tags = list(DEFAULT_TAGS)

managed_keys = {
    "title",
    "slug",
    "description",
    "publishedAt",
    "category",
    "tags",
    "sourceHtmlFile",
}
extra_items = [entry for entry in existing_items if entry["key"] not in managed_keys]

body = existing_body if existing_body.strip() else DEFAULT_BODY

lines = ["---"]
lines.extend(render_scalar_entry("title", title))
lines.extend(render_scalar_entry("slug", slug))
lines.extend(render_scalar_entry("description", description))

if not has_published_at and "publishedAt" in existing_map:
    lines.extend(existing_map["publishedAt"]["raw_lines"])
else:
    lines.extend(render_scalar_entry("publishedAt", published_at))

if not has_category and "category" in existing_map:
    lines.extend(existing_map["category"]["raw_lines"])
else:
    lines.extend(render_scalar_entry("category", category))

if not has_tags and "tags" in existing_map:
    lines.extend(existing_map["tags"]["raw_lines"])
else:
    lines.extend(render_list_entry("tags", tags))

for extra_item in extra_items:
    lines.extend(extra_item["raw_lines"])

lines.extend(render_scalar_entry("sourceHtmlFile", f"content/source-html/{slug}.html"))
lines.append("---")

output = "\n".join(lines) + "\n"
if body:
    output += body if body.startswith("\n") else body
    if not output.endswith("\n"):
        output += "\n"

target_md.write_text(output, encoding="utf-8")
PY

echo "WEB反映用ファイルを作成しました。"
echo "  - HTML: $TARGET_HTML"
echo "  - MD:   $TARGET_MD"
echo ""
echo "確認後の公開:"
echo "  bash scripts/publish-article.sh $SLUG"
