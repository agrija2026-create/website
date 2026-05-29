# テーマタグ運用ガイド

記事 frontmatter の `tags` は **読者タグ**（必須1〜3）と **テーマタグ**（任意0〜3）で構成します。

## 読者タグ（必須）

- `生産者向け` / `小売向け` / `流通向け` から **1〜3個**

## テーマタグ（任意・正規語彙のみ）

frontmatter には **下表の日本語ラベル** をそのまま書きます。英語スラッグは使いません。

| ラベル | URL（参考） | 使い分けの目安 |
|--------|-------------|----------------|
| 補助金 | `/tags/subsidy` | 予算カテゴリの国の交付金・補正事業（個別タグがない場合） |
| 輸出 | `/tags/export` | 輸出支援・GFP・インバウンド・海外規制 |
| 農地バンク | `/tags/nouchibank` | 農地中間管理・集約化・遊休農地 |
| 金融・融資 | `/tags/finance` | 公庫・共済・各種資金 |
| 食品ロス | `/tags/food-loss` | 食品ロス削減法・リサイクル法・ロス削減 |
| 流通 | `/tags/distribution` | 商慣行・物流2024・流通再編（食品ロスとは別） |
| 就農 | `/tags/employment` | トライアル就農・就農資金・女性活躍・新規就農者計画 |
| 六次産業 | `/tags/sixth-industry` | 地域資源・産地づくり・食育基本計画 |
| 共同利用 | `/tags/facility` | 共同利用施設の整備 |
| 大規模化 | `/tags/large-scale-growth-subsidy` | 大規模化・成長型交付金 |
| 交付金 | `/tags/direct-payment` | 直接支払交付金（水田活用等） |
| オーガニックビレッジ | `/tags/organic-village` | オーガニックビレッジ宣言・関連事業 |
| 災害対応 | `/tags/disaster` | 豪雨・災害復旧 |
| 肥料 | `/tags/fertilizer` | 国内肥料資源 |
| 病害虫 | `/tags/byogaichu` | 病害虫発生予報 |
| 種苗 | `/tags/seed` | 種子・種苗の安定供給 |
| ドローン | `/tags/drone` | ドローン散布 |

### 付けてはいけないもの

- **カテゴリと同義**: 政策・予算・物流・野菜・スマート農業（カテゴリ一覧で足りる）
- **廃止**: `maff`（農林水産省）、英語スラッグ（`export`, `policy` 等）
- **単独タグ不要**: GAP・規格、新規就農（→ **就農** に含める）
- **横断タグ不要**: みどり・有機 など曖昧なまとめタグ

## 新規記事のタグ付け

1. 読者タグを1〜3個選ぶ
2. slug と category からテーマタグを提案:

```bash
python3 scripts/suggest-theme-tags.py <slug> <category>
```

3. 提案を確認し、必要なら手動で調整（0〜3個）
4. `npm run build` で未登録タグがないか確認

`article:stage` 実行時も、タグ未指定なら上記スクリプトと同じルールでテーマタグが付きます。

## 実装

- 正規語彙: `lib/tags.ts` の `THEME_TAG_REGISTRY`
- 自動提案: `lib/themeTagAssign.ts` / `scripts/suggest-theme-tags.py`
