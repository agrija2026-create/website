#!/usr/bin/env python3
"""PDF の1ページを PNG にレンダリングする（公式スライドをページ単位で掲載する用）。

記事生成ルール: スライドの一部切り抜きはせず、該当ページをまるごと画像化する。
依存: pip install pymupdf
"""

from __future__ import annotations

import argparse
import pathlib
import sys


def main() -> int:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("エラー: PyMuPDF が必要です。  pip install pymupdf", file=sys.stderr)
        return 1

    parser = argparse.ArgumentParser(description="PDF の1ページを PNG に書き出す")
    parser.add_argument("--pdf", required=True, type=pathlib.Path, help="入力 PDF")
    parser.add_argument("--page", type=int, default=0, help="0 始まりのページ番号")
    parser.add_argument("--out", required=True, type=pathlib.Path, help="出力 PNG")
    parser.add_argument("--max-width", type=int, default=1600, help="画像の最大幅（px）")
    args = parser.parse_args()

    pdf_path = args.pdf.expanduser().resolve()
    if not pdf_path.is_file():
        print(f"エラー: ファイルがありません: {pdf_path}", file=sys.stderr)
        return 1

    doc = fitz.open(pdf_path)
    try:
        if args.page < 0 or args.page >= doc.page_count:
            print(f"エラー: page は 0〜{doc.page_count - 1} の範囲で指定してください", file=sys.stderr)
            return 1
        page = doc.load_page(args.page)
        zoom = min(3.0, args.max_width / page.rect.width)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out_path = args.out.expanduser().resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(out_path))
        print(f"出力: {out_path} ({pix.width}×{pix.height}px)")
    finally:
        doc.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
