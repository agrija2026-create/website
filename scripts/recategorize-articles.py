#!/usr/bin/env python3
"""記事 frontmatter の category を一括更新する。

使い方:
  python3 scripts/recategorize-articles.py          # dry-run（変更一覧のみ）
  python3 scripts/recategorize-articles.py --apply  # 本番適用
"""
from __future__ import annotations

import argparse
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / "content" / "articles"

# slug → 新 category（2026-05 カテゴリ再分配）
RECATEGORIZE_MAP: dict[str, str] = {
    # → budget
    "domestic-fertilizer-resource-expansion": "budget",
    "large-scale-growth-investment-subsidy-5": "budget",
    "livestock-budget-r7-supplement": "budget",
    "private-capital-agriculture-finance-r8": "budget",
    "agricultural-modernization-fund": "budget",
    "agricultural-improvement-fund": "budget",
    "super-l-agricultural-infrastructure-loan": "budget",
    "rural-resource-facility-infrastructure": "budget",
    "rural-resource-value-creation-promotion": "budget",
    "jfc-agrifood-export-baseline-finance": "budget",
    "haccp-facility-export-r7": "budget",
    "employment-route-farming-fund": "budget",
    "farm-land-efficiency-loan-support-r8": "budget",
    "organic-conversion-promotion": "budget",
    "advanced-organic-farming-expansion": "budget",
    "organic-farming-hub-expansion": "budget",
    "energy-saving-greenhouse-conversion": "budget",
    "green-production-system-acceleration": "budget",
    "agricultural-plastic-emission-reduction": "budget",
    "facility-horticulture-fuel-safety-net": "budget",
    "production-base-power-up-program": "budget",
    "plant-variety-overseas-protection": "budget",
    "trial-farming-employment-promotion": "budget",
    "regional-farm-structure-transition-support": "budget",
    # → market
    "overseas-earnings-agrifood-export-r6": "market",
    "washoku-overseas-demand-expansion-program": "market",
    "gfp-export-community": "market",
    "agrifood-export-promotion": "market",
    "inbound-food-export-model-r8": "market",
    "vegetable-price-outlook-r8-may": "market",
    "domestic-vegetable-share-recovery": "market",
    "japan-agricultural-import-tariff-system": "market",
    "certified-export-promotion-organization": "market",
    # → logistics
    "food-supply-chain-commercial-practices": "logistics",
    "food-distribution-reorganization-support": "logistics",
    "japan-food-loss-current-situation": "logistics",
    # → production
    "pest-disease-forecast-r8-issue-1": "production",
    "vegetable-seed-supply-stability-r8": "production",
    "organic-village-certification-paths": "production",
    # → farmland
    "creative-agricultural-management-expansion": "farmland",
    "women-active-promotion-agriculture": "farmland",
    "farmland-bank-utilization-benefits": "farmland",
    "farmland-cultivation-condition-improvement": "farmland",
    "municipal-certified-new-farmer-plan-mechanism": "farmland",
    "regional-resource-value-creation": "farmland",
    # → technology
    "drone-aerial-pesticide-spraying": "technology",
    # → food-safety
    "international-standard-gap": "food-safety",
    "jas-export-standardization-consignment": "food-safety",
    "export-destination-regulation-support": "food-safety",
}

CATEGORY_LINE = re.compile(r'^category:\s*"?([a-z0-9-]+)"?\s*$', re.MULTILINE)


def slug_from_path(path: Path) -> str:
    return path.stem


def read_category(content: str) -> str | None:
    match = CATEGORY_LINE.search(content)
    return match.group(1) if match else None


def replace_category(content: str, new_category: str) -> str:
    return CATEGORY_LINE.sub(f'category: "{new_category}"', content, count=1)


def main() -> None:
    parser = argparse.ArgumentParser(description="記事 category を一括更新")
    parser.add_argument("--apply", action="store_true", help="ファイルを書き換える（省略時は dry-run）")
    args = parser.parse_args()

    changes: list[tuple[str, str, str]] = []
    skipped: list[str] = []
    missing: list[str] = []

    for slug, new_cat in sorted(RECATEGORIZE_MAP.items()):
        path = ARTICLES_DIR / f"{slug}.md"
        if not path.exists():
            missing.append(slug)
            continue
        content = path.read_text(encoding="utf-8")
        old_cat = read_category(content)
        if old_cat is None:
            skipped.append(f"{slug}: category 行なし")
            continue
        if old_cat == new_cat:
            skipped.append(f"{slug}: 既に {new_cat}")
            continue
        changes.append((slug, old_cat, new_cat))
        if args.apply:
            path.write_text(replace_category(content, new_cat), encoding="utf-8")

    print(f"対象マップ: {len(RECATEGORIZE_MAP)} 件")
    print(f"変更{'適用' if args.apply else '予定'}: {len(changes)} 件")
    for slug, old, new in changes:
        print(f"  {slug}: {old} → {new}")

    if skipped:
        print(f"\nスキップ: {len(skipped)} 件")
        for line in skipped:
            print(f"  {line}")

    if missing:
        print(f"\nファイル未存在: {len(missing)} 件")
        for slug in missing:
            print(f"  {slug}")

    counts: Counter[str] = Counter()
    for path in sorted(ARTICLES_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue
        cat = read_category(path.read_text(encoding="utf-8"))
        if cat:
            counts[cat] += 1

    print("\nカテゴリ別件数:")
    for cat, n in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"  {cat}: {n}")
    print(f"  合計: {sum(counts.values())}")


if __name__ == "__main__":
    main()
