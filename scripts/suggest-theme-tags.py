#!/usr/bin/env python3
"""slug と category からテーマタグを提案（CLI）"""
from __future__ import annotations

import sys
from pathlib import Path

# migrate-theme-tags.py と同じロジック
sys.path.insert(0, str(Path(__file__).resolve().parent))
from migrate_theme_tags import suggest_theme_tags  # type: ignore  # noqa: E402

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使い方: python3 scripts/suggest-theme-tags.py <slug> <category>", file=sys.stderr)
        sys.exit(1)
    slug, category = sys.argv[1], sys.argv[2]
    tags = suggest_theme_tags(slug, category)
    if tags:
        print(" ".join(tags))
    else:
        print("(テーマタグなし)")
