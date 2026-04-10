#!/usr/bin/env bash
# 記事図版に AVIF を置かない（ブラウザ・sips 出力の互換で真っ白になるのを防ぐ）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bad=0
while IFS= read -r -d '' f; do
  echo "error: AVIF は使用禁止です: $f" >&2
  bad=1
done < <(find "$ROOT/public/article-images" -name '*.avif' -type f -print0 2>/dev/null || true)
if [[ "$bad" -ne 0 ]]; then
  echo "PNG 等に変換し、content/source-html の img src も更新してください。" >&2
  exit 1
fi
if grep -rE '/article-images/[^"[:space:]]+\.avif' "$ROOT/content/source-html" --include='*.html' -q 2>/dev/null; then
  echo "error: source-html に /article-images/... の .avif 参照が残っています:" >&2
  grep -rE '/article-images/[^"[:space:]]+\.avif' "$ROOT/content/source-html" --include='*.html' >&2 || true
  exit 1
fi
exit 0
