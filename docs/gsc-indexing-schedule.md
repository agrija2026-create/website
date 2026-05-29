# GSC インデックス登録スケジュール（agri-ja.net）

Search Console の **URL 検査** で未インデックス記事に「インデックス登録をリクエスト」する際の優先順です。

- **作成日:** 2026-05-29
- **対象プロパティ:** `https://agri-ja.net/`
- **記事総数:** 87（2026-05-29 時点）
- **すでにインデックス済みと想定する記事（5本）:** リクエスト不要
  - `food-recycling-law-overview`
  - `idle-farmland-elimination-measures`
  - `logistics-innovation-promotion`
  - `biomass-local-consumption`
  - `domestic-fertilizer-resource-expansion`
- **すでにインデックス済みと想定するページ:** `/` , `/tags/reader-producers`

---

## 運用ルール

### URL検査 vs インデックス登録リクエスト

| 操作 | 目的 | 1日の目安 |
|------|------|-----------|
| **URL検査**（ステータス確認） | Discovered / Crawled / Indexed を把握 | 10〜15 URL まで OK |
| **インデックス登録をリクエスト** | クロール・インデックスを促す | **5〜8 URL / 日**（クォータ制限あり） |

- **1日に全82本をリクエストしない。** 目安は **毎日 5〜8 本 × 2〜3 週間**。
- GSC で **すでに「URL は Google に登録済み」** の URL はスキップ。
- **「Detected – currently not indexed」** → リクエスト優先。
- **「Crawled – currently not indexed」** → 本文・内部リンクを確認してからリクエスト。
- 作業前に [sitemap.xml](https://agri-ja.net/sitemap.xml) が GSC に登録されているか確認。

### 記録用チェック

各 URL の右列 `[ ]` を GSC 作業後に `[x]` に変更してください。

---

## Day 1 — Tier 0：発見経路（一覧・ハブ）

サイト全体のクロール効率を上げるページを先に処理します。

| 優先 | URL | メモ |
|:----:|-----|------|
| 1 | https://agri-ja.net/recent | 全記事一覧 |
| 2 | https://agri-ja.net/categories/policy | 未インデックス最多カテゴリの一つ |
| 3 | https://agri-ja.net/categories/farmland | 農地・担い手 |
| 4 | https://agri-ja.net/categories/budget | 予算・財政 |
| 5 | https://agri-ja.net/tags/reader-distribution | 流通向けハブ（reader-producers は済想定） |
| 6 | https://agri-ja.net/tags/reader-retail | 小売向けハブ |

---

## Day 2 — Tier 1：食品ロスクラスター（代表）

被リンクの中心。クラスター全体のインデックスに効きやすい記事から。

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/food-loss-reduction-promotion-act | 食品ロス削減推進法の解説 | [ ] |
| 2 | https://agri-ja.net/articles/japan-food-loss-current-situation | 食品ロスの現状の解説 | [ ] |
| 3 | https://agri-ja.net/articles/food-supply-chain-commercial-practices | 商慣習の見直しの解説 | [ ] |
| 4 | https://agri-ja.net/articles/food-supply-crisis-countermeasures-act | 食料供給困難事態対策法の解説 | [ ] |
| 5 | https://agri-ja.net/articles/food-industry-sustainability-food-loss | （白書・食品ロス関連） | [ ] |

※ `food-recycling-law-overview` はインデックス済み想定のため省略。

---

## Day 3 — Tier 1：基本計画・農地バンク代表

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/new-food-agriculture-rural-basic-plan | 新たな食料・農業・農村基本計画の解説 | [ ] |
| 2 | https://agri-ja.net/articles/farmland-bank-guide | 農地バンクとは？ | [ ] |
| 3 | https://agri-ja.net/articles/farmland-bank-utilization-benefits | 農地バンクを活用するメリットの解説 | [ ] |
| 4 | https://agri-ja.net/articles/farmland-consolidation-promotion-program | 農地集約化促進事業の解説 | [ ] |
| 5 | https://agri-ja.net/articles/farmland-bank-zero-farmer-infrastructure | 機構関連農地整備事業の解説 | [ ] |

---

## Day 4 — Tier 2：農地バンク残り + 農地関連

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/farmland-bank-renewal-burden-reduction | 農地バンクの更新手続の解説 | [ ] |
| 2 | https://agri-ja.net/articles/farm-land-efficiency-loan-support-r8 | 農地利用効率化等支援事業（融資主体支援タイプ） | [ ] |
| 3 | https://agri-ja.net/articles/farmland-cultivation-condition-improvement | 農地耕作条件改善事業の要点 | [ ] |
| 4 | https://agri-ja.net/articles/municipal-certified-new-farmer-plan-mechanism | 認定新規就農者制度の解説 | [ ] |

※ `idle-farmland-elimination-measures` はインデックス済み想定のため省略。

---

## Day 5 — Tier 2：みどりの食料システム（5/19 クラスター①）

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/green-production-system-acceleration | グリーンな生産体系加速化事業 | [ ] |
| 2 | https://agri-ja.net/articles/organic-conversion-promotion | 有機転換推進事業 | [ ] |
| 3 | https://agri-ja.net/articles/organic-farming-hub-expansion | 有機農業拠点創出・拡大加速化事業 | [ ] |
| 4 | https://agri-ja.net/articles/advanced-organic-farming-expansion | 先進的有機農業拡大促進事業 | [ ] |
| 5 | https://agri-ja.net/articles/regional-circular-energy-system | 地域循環型エネルギーシステム構築 | [ ] |

※ `biomass-local-consumption` はインデックス済み想定のため省略。

---

## Day 6 — Tier 2：みどりクラスター② + 環境

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/environmental-burden-reduction-support | 環境負荷低減活動定着サポート | [ ] |
| 2 | https://agri-ja.net/articles/midori-business-support-infrastructure | みどりの事業活動を支える体制整備 | [ ] |
| 3 | https://agri-ja.net/articles/agricultural-plastic-emission-reduction | プラスチック排出抑制対策事業 | [ ] |
| 4 | https://agri-ja.net/articles/energy-saving-greenhouse-conversion | 省エネルギー型ハウス転換事業 | [ ] |
| 5 | https://agri-ja.net/articles/agrifood-circular-economy-leading-region | 農林漁業循環経済先導地域づくり | [ ] |

---

## Day 7 — Tier 3：輸出・5/27 クラスター

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/maff-prefecture-export-coordination | 国と都道府県の輸出促進連携 | [ ] |
| 2 | https://agri-ja.net/articles/maff-ja-export-liaison | 国とJAグループの輸出連携 | [ ] |
| 3 | https://agri-ja.net/articles/certified-export-promotion-organization | 品目団体（認定輸出促進団体） | [ ] |
| 4 | https://agri-ja.net/articles/japan-agricultural-import-tariff-system | 農林水産物の関税制度 | [ ] |
| 5 | https://agri-ja.net/articles/washoku-overseas-demand-expansion-program | 日本食・食文化の魅力発信事業 | [ ] |

---

## Day 8 — Tier 3：野菜・需給（5/26）+ 輸出関連

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/vegetable-market-situation-overview | 野菜をめぐる情勢の解説 | [ ] |
| 2 | https://agri-ja.net/articles/vegetable-price-stability-system | 野菜価格安定制度の解説 | [ ] |
| 3 | https://agri-ja.net/articles/vegetable-price-stability-measures-r8 | 野菜価格安定対策事業（令和8年度） | [ ] |
| 4 | https://agri-ja.net/articles/gfp-export-community | 農林水産物・食品輸出プロジェクト（GFP） | [ ] |
| 5 | https://agri-ja.net/articles/overseas-earnings-agrifood-export-r6 | 「海外から稼ぐ力」の強化 | [ ] |

---

## Day 9 — Tier 3：地域資源・六次産業（5/26）

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/regional-resource-value-creation | 地域資源活用価値創出 | [ ] |
| 2 | https://agri-ja.net/articles/rural-resource-value-creation-promotion | 地域資源活用価値創出推進事業（創出支援型） | [ ] |
| 3 | https://agri-ja.net/articles/rural-resource-facility-infrastructure | 地域資源活用価値創出整備事業 | [ ] |
| 5 | https://agri-ja.net/articles/rural-resource-value-creation-policy | 地域資源活用価値創出対策 | [ ] |

---

## Day 10 — Tier 4：予算・財政・補助金

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/strong-agriculture-comprehensive-grant-r8 | 強い農業づくり総合支援交付金 | [ ] |
| 2 | https://agri-ja.net/articles/successor-farm-machinery-facility-r8 | 担い手への農業用機械・施設の導入支援 | [ ] |
| 3 | https://agri-ja.net/articles/paddy-field-direct-payment-r8 | 水田活用の直接支払交付金等 | [ ] |
| 4 | https://agri-ja.net/articles/shared-facility-infrastructure-support-r8 | 共同利用施設の整備支援 | [ ] |
| 5 | https://agri-ja.net/articles/regional-farm-structure-transition-support | 地域農業構造転換支援事業 | [ ] |

※ `domestic-fertilizer-resource-expansion` はインデックス済み想定のため省略。

---

## Day 11 — Tier 4：金融・就農・5/15 クラスター

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/agricultural-modernization-fund | 農業近代化資金の解説 | [ ] |
| 2 | https://agri-ja.net/articles/agricultural-improvement-fund | 農業改良資金の解説 | [ ] |
| 3 | https://agri-ja.net/articles/super-l-agricultural-infrastructure-loan | 農業経営基盤強化資金（スーパーL） | [ ] |
| 4 | https://agri-ja.net/articles/employment-route-farming-fund | 雇用就農資金の解説 | [ ] |
| 5 | https://agri-ja.net/articles/trial-farming-employment-promotion | トライアル雇用就農促進事業 | [ ] |

---

## Day 12 — Tier 4：5/22 政策 + 白書系

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/agricultural-competitiveness-support-act | 農業競争力強化支援法 | [ ] |
| 2 | https://agri-ja.net/articles/fourth-shokuiku-promotion-basic-plan | 第4次食育推進基本計画 | [ ] |
| 3 | https://agri-ja.net/articles/international-standard-gap | 国際水準GAP | [ ] |
| 4 | https://agri-ja.net/articles/climate-biodiversity-response-r6 | 気候変動・生物多様性への対応 | [ ] |
| 5 | https://agri-ja.net/articles/creative-agricultural-management-expansion | 創意工夫を生かした農業経営の展開 | [ ] |

---

## Day 13 — Tier 4：5/11 クラスター + 輸出支援

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/agrifood-export-promotion | 農林水産物・食品の輸出促進の取組 | [ ] |
| 2 | https://agri-ja.net/articles/livestock-budget-r7-supplement | 畜産枠（令和7年度補正） | [ ] |
| 3 | https://agri-ja.net/articles/haccp-facility-export-r7 | ハザップ対応設備補助 | [ ] |
| 4 | https://agri-ja.net/articles/domestic-vegetable-share-recovery | 国産野菜シェア奪還プロジェクト | [ ] |
| 5 | https://agri-ja.net/articles/facility-horticulture-fuel-safety-net | 施設園芸セーフティネット | [ ] |

---

## Day 14 — Tier 4：4月公開記事（早期記事の未インデックス分）

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/articles/smart-agriculture-trend | スマート農業をめぐる情勢 | [ ] |
| 2 | https://agri-ja.net/articles/pest-disease-forecast-r8-issue-1 | 病害虫発生予報 第1号 | [ ] |
| 3 | https://agri-ja.net/articles/organic-village-certification-paths | オーガニックビレッジ | [ ] |
| 4 | https://agri-ja.net/articles/production-base-power-up-program | 産地生産基盤パワーアップ事業 | [ ] |
| 5 | https://agri-ja.net/articles/inbound-food-export-model-r8 | インバウンド起点・輸出支援モデル | [ ] |

※ `logistics-innovation-promotion` はインデックス済み想定のため省略。

---

## Day 15 — Tier 4：残り（カテゴリ代表・その他）

| 優先 | URL | タイトル（参考） | GSC |
|:----:|-----|------------------|:---:|
| 1 | https://agri-ja.net/categories/market | カテゴリ：市場・価格・需給 | [ ] |
| 2 | https://agri-ja.net/categories/logistics | カテゴリ：流通・物流 | [ ] |
| 3 | https://agri-ja.net/categories/technology | カテゴリ：技術・DX | [ ] |
| 4 | https://agri-ja.net/categories/food-safety | カテゴリ：表示・規格・食品安全 | [ ] |
| 5 | https://agri-ja.net/articles/agricultural-mutual-aid-r8 | 農業共済事業 | [ ] |

---

## Day 16 以降 — バックログ（Day 1〜15 で未処理のもの）

以下は Day 1〜15 に含まれていない slug です。上記を終えたあと、**1日 5〜8 本**ずつ末尾から処理してください。

```
https://agri-ja.net/articles/ag-material-business-reorganization-support
https://agri-ja.net/articles/large-scale-growth-investment-subsidy-5
https://agri-ja.net/articles/drone-aerial-pesticide-spraying
https://agri-ja.net/articles/export-destination-regulation-support
https://agri-ja.net/articles/food-distribution-reorganization-support
https://agri-ja.net/articles/food-industry-sound-development-r6
https://agri-ja.net/articles/heavy-rain-agrifood-disaster-response
https://agri-ja.net/articles/vegetable-price-outlook-r8-may
https://agri-ja.net/articles/jas-export-standardization-consignment
https://agri-ja.net/articles/jfc-agrifood-export-baseline-finance
https://agri-ja.net/articles/plant-variety-overseas-protection
https://agri-ja.net/articles/private-capital-agriculture-finance-r8
https://agri-ja.net/articles/trial-farming-employment-promotion
https://agri-ja.net/articles/women-active-promotion-agriculture
https://agri-ja.net/articles/vegetable-seed-supply-stability-r8
```

作業前に GSC でインデックス済みか確認し、済みの URL はスキップしてください。

---

## 作業ログ（任意）

| 日付 | リクエスト数 | メモ |
|------|:------------:|------|
| | | |
| | | |
| | | |

---

## 関連ドキュメント

- インデックス差分分析: `.cursor/plans/インデックス差分分析_6236e560.plan.md`
- サイトマップ: https://agri-ja.net/sitemap.xml
- `/kisai/` 重複プレビュー: **2026-05-29 削除済み**（デプロイ後 404）

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-05-29 | 初版作成（Tier 0〜4、Day 1〜16 スケジュール） |
