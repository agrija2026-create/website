#!/usr/bin/env bash
# 初回: Git ユーザー設定 → コミット（未コミットがあれば）→ GitHub へ push
# 必要な情報は setup.secrets.env に記入（setup.secrets.env.example をコピー）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SECRETS_FILE="${ROOT}/setup.secrets.env"
if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "エラー: ${SECRETS_FILE} がありません。"
  echo "  cp setup.secrets.env.example setup.secrets.env"
  echo "を実行し、名前・メール・GH_TOKEN などを埋めてから再実行してください。"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$SECRETS_FILE"
set +a

if [[ -z "${GIT_USER_NAME:-}" || -z "${GIT_USER_EMAIL:-}" ]]; then
  echo "エラー: setup.secrets.env に GIT_USER_NAME と GIT_USER_EMAIL を設定してください。"
  exit 1
fi

GITHUB_OWNER="${GITHUB_OWNER:-agrija2026-create}"
GITHUB_REPO="${GITHUB_REPO:-website}"
REMOTE_HTTPS="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"

git config user.name "$GIT_USER_NAME"
git config user.email "$GIT_USER_EMAIL"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init
  git branch -M main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_HTTPS"
else
  git remote set-url origin "$REMOTE_HTTPS"
fi

git add -A
if ! git diff --staged --quiet; then
  git commit -m "chore: initial commit (nogyo-media)"
fi

if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "エラー: コミットするファイルがありません。プロジェクトにファイルがあるか確認してください。"
  exit 1
fi

git branch -M main

# remote は常にトークンなし URL（トークンは push の URL にだけ使う）
git remote set-url origin "$REMOTE_HTTPS"

push_with_token() {
  local url="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
  git push "$url" "refs/heads/main:refs/heads/main"
}

if [[ -n "${GH_TOKEN:-}" ]]; then
  echo "GitHub へ push しています（トークン認証）…"
  push_with_token
  git branch --set-upstream-to=origin/main main 2>/dev/null || true
elif command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI の認証を使って push しています…"
  git push -u origin main
else
  echo "エラー: GH_TOKEN が空で、GitHub CLI にもログインしていません。"
  echo "  setup.secrets.env に GH_TOKEN を入れるか、ターミナルで gh auth login を実行してください。"
  exit 1
fi

echo "完了: GitHub に push しました (${REMOTE_HTTPS})"

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "Vercel へ初回デプロイを実行します…"
  bash "${ROOT}/scripts/vercel-first-deploy.sh"
else
  echo ""
  echo "次のステップ（push のたびに自動デプロイしたい場合）:"
  echo "  Vercel で New Project → この GitHub リポジトリを Import（Root Directory は空のまま）"
  echo ""
  echo "Vercel をトークンだけで先に本番 URL を出したい場合は、setup.secrets.env に VERCEL_TOKEN を追加し、"
  echo "  npm run setup:vercel"
  echo "を実行してください。"
fi
