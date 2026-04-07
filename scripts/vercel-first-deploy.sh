#!/usr/bin/env bash
# Vercel に本番デプロイ（トークン必須）。初回はプロジェクトが自動作成されます。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SECRETS_FILE="${ROOT}/setup.secrets.env"
if [[ -f "$SECRETS_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
  set +a
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "エラー: VERCEL_TOKEN が設定されていません。"
  echo "  setup.secrets.env に VERCEL_TOKEN=... を追加するか、環境変数で渡してください。"
  echo "  トークンは Vercel → Account Settings → Tokens で作成できます。"
  exit 1
fi

echo "Vercel にデプロイしています（対話なし）…"
# --yes: 質問にデフォルトで回答 / --prod: 本番
npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"

echo ""
echo "完了。ダッシュボードで URL を確認し、GitHub 連携を有効にすると今後の push が自動デプロイになります。"
