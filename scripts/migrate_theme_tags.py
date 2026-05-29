#!/usr/bin/env python3
"""全記事のテーマタグを正規語彙に移行する（一度きり・再実行可）"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "content" / "articles"

AUDIENCE = {"生産者向け", "小売向け", "流通向け"}

# lib/themeTagAssign.ts と同期（Python 単体実行用）
TAG_RULES: list[tuple[str, list[str]]] = [
    ("交付金", [r"paddy-field-direct-payment"]),
    ("大規模化", [r"large-scale-growth-investment"]),
    ("共同利用", [r"shared-facility-infrastructure"]),
    ("オーガニックビレッジ", [r"organic-village-certification-paths", r"organic-farming-hub-expansion"]),
    ("病害虫", [r"pest-disease-forecast"]),
    ("種苗", [r"vegetable-seed-supply"]),
    ("ドローン", [r"drone-aerial"]),
    ("肥料", [r"^domestic-fertilizer-resource-expansion$"]),
    ("災害対応", [r"heavy-rain-agrifood"]),
    (
        "食品ロス",
        [
            r"food-loss-reduction-promotion",
            r"food-recycling-law-overview",
            r"japan-food-loss-current",
            r"food-industry-sustainability-food-loss",
        ],
    ),
    (
        "流通",
        [
            r"food-supply-chain-commercial",
            r"food-distribution-reorganization",
            r"logistics-innovation-promotion",
            r"food-industry-sound-development",
        ],
    ),
    (
        "輸出",
        [
            r"export",
            r"washoku-overseas",
            r"gfp-export",
            r"agrifood-export",
            r"jas-export",
            r"inbound-food-export",
            r"maff-prefecture-export",
            r"maff-ja-export",
            r"certified-export",
            r"export-destination",
            r"plant-variety-overseas",
            r"domestic-vegetable-share",
            r"overseas-earnings",
            r"haccp-facility-export",
            r"^vegetable-price-outlook-r8-may$",
            r"production-base-power-up-program",
        ],
    ),
    (
        "農地バンク",
        [
            r"nouchibank",
            r"farmland-bank",
            r"idle-farmland",
            r"farmland-consolidation",
        ],
    ),
    (
        "就農",
        [
            r"trial-farming-employment",
            r"trial-on-farm-employment",
            r"employment-route-farming",
            r"municipal-certified-new-farmer",
            r"women-agriculture-empowerment",
            r"women-active-promotion",
            r"creative-agricultural-management",
        ],
    ),
    (
        "六次産業",
        [
            r"regional-resource-value",
            r"rural-resource-",
            r"fourth-shokuiku-promotion",
            r"^seibi-55$",
        ],
    ),
    (
        "金融・融資",
        [
            r"jfc-agrifood-export-baseline",
            r"agricultural-modernization-fund",
            r"agricultural-improvement-fund",
            r"super-l-agricultural-infrastructure",
            r"agricultural-mutual-aid",
            r"farm-land-efficiency-loan",
            r"farmland-efficiency-loan-support",
        ],
    ),
]

SLUG_OVERRIDES: dict[str, list[str] | None] = {
    "international-standard-gap": [],
    "smart-agriculture-trend": [],
    "japan-agricultural-import-tariff-system": [],
    "climate-biodiversity-response-r6": [],
    "food-supply-crisis-countermeasures-act": [],
    "new-food-agriculture-rural-basic-plan": [],
    "agricultural-competitiveness-support-act": [],
    "ag-material-business-reorganization-support": [],
    "vegetable-market-situation-overview": [],
    "vegetable-price-stability-system": [],
    "japan-food-loss-current-situation": ["食品ロス"],
    "overseas-earnings-agrifood-export-r6": ["輸出"],
    "gfp-export-community": ["輸出"],
    "regional-farm-structure-transition-support": ["補助金"],
    "livestock-budget-r7-supplement": ["補助金"],
    "facility-horticulture-fuel-safety-net": ["補助金"],
    "private-capital-agriculture-finance-r8": ["補助金"],
    "vegetable-price-stability-measures-r8": ["補助金"],
    "successor-farm-machinery-facility-r8": ["補助金"],
    "strong-agriculture-comprehensive-grant-r8": ["補助金"],
    "pest-disease-forecast-r8-issue-1": ["病害虫"],
}

CATEGORY_OVERLAP = {
    "policy": "政策",
    "budget": "予算",
    "logistics": "物流",
    "technology": "スマート農業",
    "production": "野菜",
    "market": "野菜",
}

BUDGET_DEFAULT_EXCLUDE = re.compile(
    r"export|finance|nouchibank|farmland-bank|paddy-field-direct|large-scale-growth|shared-facility|"
    r"employment-route-farming|mutual-aid|jfc-agrifood|super-l|modernization|"
    r"improvement-fund|farm-land-efficiency|farmland-efficiency-loan|domestic-fertilizer-resource-expansion|"
    r"heavy-rain|drone-aerial|pest-disease-forecast|organic-village|organic-farming-hub"
)


def strip_overlap(tags: list[str], category: str) -> list[str]:
    overlap = CATEGORY_OVERLAP.get(category)
    if not overlap:
        return tags
    return [t for t in tags if t != overlap]


def suggest_theme_tags(slug: str, category: str) -> list[str]:
    if slug in SLUG_OVERRIDES:
        override = SLUG_OVERRIDES[slug]
        if override is None:
            return []
        return strip_overlap(override, category)[:3]

    tags: list[str] = []
    for label, patterns in TAG_RULES:
        if any(re.search(p, slug) for p in patterns) and label not in tags:
            tags.append(label)

    if category == "budget" and not tags and not BUDGET_DEFAULT_EXCLUDE.search(slug):
        tags.append("補助金")

    return strip_overlap(tags, category)[:3]


def parse_frontmatter(text: str) -> tuple[dict, str, str]:
    if not text.startswith("---\n"):
        return {}, text, text
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not m:
        return {}, text, text
    fm = m.group(1)
    body = text[m.end() :]
    data: dict = {}
    lines = fm.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        km = re.match(r"^([A-Za-z0-9_]+):(?:\s*(.*))?$", line)
        if not km:
            i += 1
            continue
        key, rest = km.group(1), km.group(2) or ""
        if rest == "":
            vals: list[str] = []
            i += 1
            while i < len(lines):
                lm = re.match(r'^  -\s*(?:"([^"]*)"|(.+))$', lines[i])
                if not lm:
                    break
                vals.append(lm.group(1) if lm.group(1) is not None else lm.group(2))
                i += 1
            data[key] = vals
        else:
            if rest.startswith('"') and rest.endswith('"'):
                data[key] = rest[1:-1]
            else:
                data[key] = rest
            i += 1
    return data, fm, body


def yaml_quote(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', r"\"") + '"'


def render_tags(tags: list[str]) -> list[str]:
    lines = ["tags:"]
    for t in tags:
        lines.append(f"  - {yaml_quote(t)}")
    return lines


def rebuild_md(data: dict, body: str) -> str:
    order = [
        "title",
        "slug",
        "description",
        "publishedAt",
        "category",
        "tags",
        "readingMinutes",
        "takeaways",
        "sourceHtmlFile",
    ]
    lines = ["---"]
    seen = set()
    for key in order:
        if key not in data:
            continue
        seen.add(key)
        val = data[key]
        if key == "tags":
            lines.extend(render_tags(val))
        elif key == "takeaways":
            lines.append("takeaways:")
            for item in val:
                lines.append(f"  - {yaml_quote(str(item))}")
        elif isinstance(val, list):
            lines.append(f"{key}:")
            for item in val:
                lines.append(f"  - {yaml_quote(str(item))}")
        else:
            lines.append(f"{key}: {yaml_quote(str(val))}")
    for key, val in data.items():
        if key in seen:
            continue
        if isinstance(val, list):
            lines.append(f"{key}:")
            for item in val:
                lines.append(f"  - {yaml_quote(str(item))}")
        else:
            lines.append(f"{key}: {yaml_quote(str(val))}")
    lines.append("---")
    if body and not body.startswith("\n"):
        lines.append("")
    return "\n".join(lines) + body


def main() -> None:
    counts: dict[str, int] = {}
    updated = 0
    for path in sorted(ARTICLES.glob("*.md")):
        if path.name.startswith("_"):
            continue
        raw = path.read_text(encoding="utf-8")
        data, _, body = parse_frontmatter(raw)
        slug = str(data.get("slug", path.stem))
        category = str(data.get("category", ""))
        old_tags = data.get("tags", [])
        if not isinstance(old_tags, list):
            old_tags = [old_tags]

        audience = [t for t in old_tags if t in AUDIENCE]
        if not audience:
            audience = ["生産者向け"]

        theme = suggest_theme_tags(slug, category)
        new_tags = audience + theme
        data["tags"] = new_tags

        for t in theme:
            counts[t] = counts.get(t, 0) + 1

        new_raw = rebuild_md(data, body)
        if new_raw != raw:
            path.write_text(new_raw, encoding="utf-8")
            updated += 1
        print(f"{slug}: {theme or '(なし)'}")

    print(f"\nUpdated {updated} files")
    print("\nTag counts:")
    for label, n in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"  {label}: {n}")


if __name__ == "__main__":
    main()
