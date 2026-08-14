#!/usr/bin/env bash
# 溜めておいたコミットを「1日1回・まとめて」push する（ビルドは1本だけ走る）
#
# 使い方:
#   npm run article:push            # 内容を表示して push
#   npm run article:push -- --dry   # 表示だけ（push しない）
#
# なぜまとめるか（2026-08-14 ユーザー指示・運営ポリシー §0）:
#   Vercel の課金は読者のアクセス量ではなく push 回数（ビルドCPU時間）でほぼ決まる。
#   1 push ≈ $0.14 で Pro の月間クレジットは $20。5 記事を 5 回に分けて push すると
#   約 $0.70、まとめて 1 回なら約 $0.14。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DRY=0
[[ "${1:-}" == "--dry" ]] && DRY=1

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "main" ]]; then
  echo "エラー: main 以外のブランチ（${BRANCH}）にいます。中止します。"
  exit 1
fi

git fetch --quiet origin

PENDING="$(git log --oneline origin/main..HEAD | wc -l | tr -d ' ')"
if [[ "$PENDING" == "0" ]]; then
  echo "push するコミットはありません。"
  exit 0
fi

echo "=== push するコミット（${PENDING} 件）==="
git log --oneline origin/main..HEAD | sed 's/^/  /'
echo
echo "=== 変更されるファイル ==="
git diff --stat origin/main..HEAD
echo

# 作業ツリーに未コミットの変更が残っていないか（他セッションの WIP を巻き込む事故の防止）
if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "警告: 未コミットの変更が残っています（push 対象には含まれません）:"
  git status --short | sed 's/^/  /'
  echo
fi

if [[ "$DRY" == "1" ]]; then
  echo "--dry のため push しませんでした。"
  exit 0
fi

git push
echo
echo "push 完了。Vercel のビルドが1本走ります（website プロジェクトのみ）。"
echo "反映確認: https://agri-ja.net/ を数分後に確認してください。"
