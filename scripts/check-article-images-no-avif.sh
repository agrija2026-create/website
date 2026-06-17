#!/usr/bin/env bash
# 記事図版に AVIF を置かない（ブラウザ・sips 出力の互換で真っ白になるのを防ぐ）
# 注: プロセス置換 <(...) は一部のビルド環境（Vercel 等）で /dev/fd が使えず失敗するため使わない。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1) public/article-images に .avif ファイルが存在しないか
avif_files="$(find "$ROOT/public/article-images" -name '*.avif' -type f 2>/dev/null || true)"
if [[ -n "$avif_files" ]]; then
  echo "error: AVIF は使用禁止です:" >&2
  echo "$avif_files" >&2
  echo "PNG 等に変換し、content/source-html の img src も更新してください。" >&2
  exit 1
fi

# 2) source-html に /article-images/....avif の参照が残っていないか
if grep -rE '/article-images/[^"[:space:]]+\.avif' "$ROOT/content/source-html" --include='*.html' -q 2>/dev/null; then
  echo "error: source-html に /article-images/... の .avif 参照が残っています:" >&2
  grep -rE '/article-images/[^"[:space:]]+\.avif' "$ROOT/content/source-html" --include='*.html' >&2 || true
  exit 1
fi
exit 0
