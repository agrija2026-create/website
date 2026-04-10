#!/usr/bin/env bash
# PDF を記事作成用フォルダへ展開する
# 使い方:
#   bash scripts/create-article-workdir.sh <pdf-path>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_ROOT="$(cd "${ROOT}/.." && pwd)"

INPUT_DIR="${WORKSPACE_ROOT}/記事化入力"
OUTPUT_BASE_DIR="${WORKSPACE_ROOT}/記事/元資料/記事と元資料"

if [[ $# -lt 1 ]]; then
  echo "使い方: bash scripts/create-article-workdir.sh <pdf-path>"
  echo "例: bash scripts/create-article-workdir.sh \"${INPUT_DIR}/sample.pdf\""
  exit 1
fi

SOURCE_PATH="$1"
if [[ "${SOURCE_PATH}" != /* ]]; then
  SOURCE_PATH="${PWD}/${SOURCE_PATH}"
fi

if [[ ! -f "${SOURCE_PATH}" ]]; then
  echo "エラー: PDF が見つかりません: ${SOURCE_PATH}"
  exit 1
fi

LOWER_SOURCE_PATH="$(printf '%s' "${SOURCE_PATH}" | tr '[:upper:]' '[:lower:]')"
case "${LOWER_SOURCE_PATH}" in
  *.pdf) ;;
  *)
    echo "エラー: PDF のみ対応です: ${SOURCE_PATH}"
    exit 1
    ;;
esac

mkdir -p "${INPUT_DIR}"
mkdir -p "${OUTPUT_BASE_DIR}"

BASE_NAME="$(basename "${SOURCE_PATH}" .pdf)"
PDF_FILE_NAME="$(basename "${SOURCE_PATH}")"
WORKDIR="${OUTPUT_BASE_DIR}/${BASE_NAME}"
ARTICLE_HTML="${WORKDIR}/${BASE_NAME}_解説記事.html"
MEMO_FILE="${WORKDIR}/${BASE_NAME}_作業メモ.md"

mkdir -p "${WORKDIR}"
cp -f "${SOURCE_PATH}" "${WORKDIR}/${PDF_FILE_NAME}"

if [[ ! -f "${ARTICLE_HTML}" ]]; then
  cat <<EOF > "${ARTICLE_HTML}"
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BASE_NAME}を解説</title>
  <meta name="description" content="${BASE_NAME}の要点を整理した解説記事です。">
</head>
<body>
  <article>
    <!-- 重要: data:image / base64 画像は最終公開時に外部画像へ変換する。巨大な inline style / script は使わない -->
    <!-- 図版は使ってよいが、軽量な外部画像として扱い、figcaption を付ける -->
    <p>${BASE_NAME}の要点を、対象者・内容・期限・金額の観点で整理します。</p>

    <h2>要点</h2>
    <p>ここから本文を作成してください。</p>

    <p class="source">【出典】ここに一次情報の資料名とURLを記載してください。</p>
  </article>
</body>
</html>
EOF
fi

if [[ ! -f "${MEMO_FILE}" ]]; then
  cat <<EOF > "${MEMO_FILE}"
# ${BASE_NAME} 作業メモ

- 元PDF: ${WORKDIR}/${PDF_FILE_NAME}
- 記事HTML: ${ARTICLE_HTML}
- ステータス: 作成開始

## 次の手順
1. \`docs/記事生成プロンプト.md\` を開き、制約に沿って \`${ARTICLE_HTML}\` を編集して記事本文を完成させる
2. 特に \`data:image\` / Base64 画像 / 巨大な inline style を含めていないことを確認する
3. 完成後、確認OKなら \`bash scripts/stage-article-for-web.sh "${ARTICLE_HTML}" <slug>\` を実行する
4. 最後に \`bash scripts/publish-article.sh <slug>\` で公開する

## 重要ルール
- 本文は \`<article>\` 内に書く
- \`<h1>\` や先頭 \`<header>\` は原則不要
- \`data:image\` や Base64 画像は最終公開時にそのまま残さない
- 図版は使ってよいが、軽量な外部画像として扱う
- 図版には \`alt\` と \`figcaption\` を付ける
- 出典名と URL を必ず入れる
EOF
fi

echo "作業フォルダを準備しました。"
echo "  - ${WORKDIR}"
echo "  - 元PDF: ${WORKDIR}/${PDF_FILE_NAME}"
echo "  - 記事HTML: ${ARTICLE_HTML}"
echo "  - 作業メモ: ${MEMO_FILE}"
