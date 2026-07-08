# ピラー（完全ガイド）× トピッククラスタ設計

内部SEOのトピッククラスタ戦略の運用メモ。**大テーマの親記事（ピラー）** と **個別記事（クラスタ）** を相互リンクで束ね、親でビッグワード・個別でロングテールを取る。

## 仕組み（実装済み）

- クラスタ定義は [`lib/articleClusters.ts`](../lib/articleClusters.ts)。**各配列の先頭 = そのクラスタのピラー（親）** とみなす。
- `getRelatedArticles`（[`lib/articles.ts`](../lib/articles.ts)）はクラスタを最優先で関連記事に出す＝**クラスタ内は自動で相互リンク**される。新規記事は該当クラスタ配列に追記すれば、既存メンバーの関連ブロックから双方向にリンクされる（本文の手直し不要）。
- テーマタグ一覧ページ（`/tags/<slug>`）も `THEME_TAG_SEO_HEAD`（[`lib/tags.ts`](../lib/tags.ts)）でヘッドワード狙いのハブとして機能する。

## 既存記事をピラーに指定（現状のクラスタ先頭）

| テーマ | ピラー（既存記事 slug） | 状態 |
|--------|------------------------|------|
| 六次産業・地域資源 | `regional-resource-value-creation` | 既存クラスタ |
| 農地バンク | `farmland-bank-guide` | 既存クラスタ |
| 野菜価格安定 | `vegetable-price-stability-system` | 既存クラスタ |
| 融資・資金 | `super-l-agricultural-infrastructure-loan` | 個別記事が暫定ピラー（下記の課題あり） |
| 収入保険・共済 | `agricultural-income-insurance` | 良好 |
| 年金・老後 | `farmers-pension-fund` | 良好 |
| 税金・確定申告 | `blue-return-farming-tax` | 個別記事が暫定ピラー |
| 輸出 | `agrifood-export-promotion` | 良好（「輸出とは・始め方」で親向き） |
| 新規就農 | `new-farmer-startup-funds` | 良好 |
| 鳥獣被害・ジビエ | `wildlife-damage-countermeasures` | 良好（「被害対策とは」で親向き） |
| 米・水田政策 | `rice-price-and-policy-overview` | 良好 |
| J-クレジット | `agriculture-carbon-credit-guide` | 良好 |
| 森林・林業 | `forest-management-system` | 良好 |
| 食品ロス | `japan-food-loss-current-situation` | 良好 |
| スマート農業 | `smart-agriculture-trend` | 良好 |
| 基盤整備 | `paddy-field-consolidation-cost` | 個別記事が暫定ピラー |
| 有機農業 | `organic-jas-certification` | 良好 |
| 物流・流通 | `logistics-innovation-promotion` | 良好 |
| 直販・六次 | `farm-stand-shipping-guide` | 良好 |

補助金は横断テーマで、既存の [`agricultural-subsidies-guide`](../content/articles/agricultural-subsidies-guide.md)（農業の補助金一覧）が事実上のピラー。タグページ `/tags/subsidy` もハブ。

## 新規ピラーを作る価値がある候補（未作成・要一次資料）

「◯◯とは・全体像・選び方」を1枚に束ねた**完全ガイド**がまだ無いテーマ。個別記事（特定の制度）しかなく、ビッグワードを取り切れていない：

- **農業の融資・資金調達 完全ガイド**（スーパーL／近代化資金／改良資金／青年等就農資金／リース の使い分け表＋各記事へ）
- **農業の税金 完全ガイド**（青色申告／法人化／インボイス／減価償却／固定資産税）
- **農業の年金・保険 完全ガイド**（農業者年金／国民年金基金／小規模企業共済／iDeCo／収入保険・共済）
- **農地の基盤整備 完全ガイド**（ほ場整備／暗渠排水／土地改良区賦課金／用水路・ため池）

## 作り方（重要・原則）

新規ピラー記事は**必ず一次資料（農水省PDF等）を起点に、通常の記事化ワークフロー（`pdf-kisetu-article` スキル）で作成**する。裏取りなしに解説記事を新規作成しない（本プロジェクトの一次情報主義）。作成後：

1. frontmatter に該当テーマタグを付け、`lib/articleClusters.ts` の当該クラスタ**先頭**へ slug を追加（＝新ピラーを親に指定）。
2. ピラー本文から主要な個別記事へ、個別記事からピラーへ、本文リンク（`<a href="/articles/...">`）を張る。
3. `article-web-publish` で公開。

※ 本文中への自動リンク挿入は、農業用語の曖昧一致で誤リンクが生じるため**採用しない**方針（2026-07-08 ユーザー判断）。
