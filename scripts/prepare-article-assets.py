#!/usr/bin/env python3
"""記事HTML内の図版を外部画像化し、軽量な公開パスへ差し替える。"""

from __future__ import annotations

import argparse
import base64
import binascii
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse


IMG_SRC_RE = re.compile(r'(<img\b[^>]*?\bsrc=)(["\'])(.*?)\2', re.IGNORECASE | re.DOTALL)
DATA_URI_RE = re.compile(
    r"^data:(image/[a-zA-Z0-9.+-]+)(?:;charset=[^;,]+)?;base64,(.*)$",
    re.IGNORECASE | re.DOTALL,
)
CSS_DATA_RE = re.compile(r"url\(\s*['\"]?data:", re.IGNORECASE)

MAX_IMAGE_WIDTH = 1600
PUBLIC_IMAGE_PREFIX = "/article-images"

MIME_TO_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/svg+xml": ".svg",
}

WRITABLE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".avif", ".heic", ".tiff"}
FORMAT_BY_EXT = {
    ".png": "png",
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".gif": "gif",
    ".avif": "avif",
    ".heic": "heic",
    ".tiff": "tiff",
}


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result.stdout


def parse_dimensions(path: pathlib.Path) -> tuple[int, int] | None:
    try:
        out = run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)])
    except subprocess.CalledProcessError:
        return None

    width_match = re.search(r"pixelWidth:\s*(\d+)", out)
    height_match = re.search(r"pixelHeight:\s*(\d+)", out)
    if not width_match or not height_match:
        return None
    return int(width_match.group(1)), int(height_match.group(1))


def choose_output_ext(input_ext: str) -> str:
    """公開図版の拡張子を決める。

    AVIF は軽量だが、macOS sips が出力する AVIF が環境によってデコードされず
    真っ白になる事例があるため、ラスタ画像の既定出力は PNG とする。
    """
    ext = input_ext.lower()
    if ext in {".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif", ".tiff", ".avif"}:
        return ".png"
    if ext in WRITABLE_EXTS:
        return ext
    return ".png"


def load_data_uri(src: str, tmpdir: pathlib.Path, index: int) -> tuple[pathlib.Path, str, int]:
    match = DATA_URI_RE.match(src)
    if not match:
      raise ValueError("unsupported data URI")

    mime = match.group(1).lower()
    encoded = re.sub(r"\s+", "", match.group(2))
    ext = MIME_TO_EXT.get(mime, ".png")
    raw = base64.b64decode(encoded, validate=False)
    input_path = tmpdir / f"inline-{index:02d}{ext}"
    input_path.write_bytes(raw)
    return input_path, ext, len(raw)


def resolve_local_source(
    src: str,
    html_path: pathlib.Path,
    public_dir: pathlib.Path,
    tmpdir: pathlib.Path,
    index: int,
) -> tuple[pathlib.Path, str, int] | None:
    parsed = urllib.parse.urlsplit(src)
    if parsed.scheme in {"http", "https"} or src.startswith("//"):
        return None

    if src.startswith("/"):
        source_path = public_dir / parsed.path.lstrip("/")
    else:
        source_path = (html_path.parent / urllib.parse.unquote(parsed.path)).resolve()

    if not source_path.is_file():
        return None

    ext = source_path.suffix or ".png"
    temp_path = tmpdir / f"local-{index:02d}{ext.lower()}"
    shutil.copyfile(source_path, temp_path)
    return temp_path, ext.lower(), source_path.stat().st_size


def optimize_image(input_path: pathlib.Path, output_path: pathlib.Path, tmpdir: pathlib.Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if input_path.suffix.lower() == ".svg":
        shutil.copyfile(input_path, output_path)
        return

    working = input_path
    dims = parse_dimensions(input_path)
    if dims and max(dims) > MAX_IMAGE_WIDTH:
        resized = tmpdir / f"{input_path.stem}-resized{input_path.suffix.lower()}"
        run(["sips", "-Z", str(MAX_IMAGE_WIDTH), str(input_path), "--out", str(resized)])
        working = resized

    if output_path.suffix.lower() == working.suffix.lower():
        shutil.copyfile(working, output_path)
        return

    fmt = FORMAT_BY_EXT[output_path.suffix.lower()]
    run(["sips", "-s", "format", fmt, str(working), "--out", str(output_path)])


def process_html(input_html: pathlib.Path, output_html: pathlib.Path, slug: str, project_root: pathlib.Path) -> tuple[int, int, int]:
    text = input_html.read_text(encoding="utf-8", errors="ignore")
    if CSS_DATA_RE.search(text):
        raise ValueError("CSS data URI is not supported")

    public_dir = project_root / "public"
    target_dir = public_dir / "article-images" / slug

    replacements: list[tuple[re.Match[str], str | None, pathlib.Path | None, str | None, int]] = []
    total_before = 0

    with tempfile.TemporaryDirectory(prefix=f"{slug}-assets-") as tmp:
        tmpdir = pathlib.Path(tmp)

        for index, match in enumerate(IMG_SRC_RE.finditer(text), start=1):
            src = match.group(3).strip()
            input_path: pathlib.Path | None = None
            input_ext: str | None = None
            size_before = 0

            if src.lower().startswith("data:image"):
                try:
                    input_path, input_ext, size_before = load_data_uri(src, tmpdir, index)
                except (ValueError, binascii.Error) as exc:
                    raise ValueError(f"invalid data URI in img src: {exc}") from exc
            else:
                resolved = resolve_local_source(src, input_html, public_dir, tmpdir, index)
                if resolved is not None:
                    input_path, input_ext, size_before = resolved

            if input_path is None or input_ext is None:
                replacements.append((match, None, None, None, 0))
                continue

            out_ext = choose_output_ext(input_ext)
            out_name = f"figure-{index:02d}{out_ext}"
            public_src = f"{PUBLIC_IMAGE_PREFIX}/{slug}/{out_name}"
            replacements.append((match, public_src, input_path, out_ext, size_before))
            total_before += size_before

        if target_dir.exists():
            shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)

        total_after = 0
        rebuilt: list[str] = []
        cursor = 0

        for index, (match, public_src, input_path, out_ext, size_before) in enumerate(replacements, start=1):
            rebuilt.append(text[cursor:match.start()])

            if public_src and input_path and out_ext:
                output_path_img = target_dir / f"figure-{index:02d}{out_ext}"
                optimize_image(input_path, output_path_img, tmpdir)
                total_after += output_path_img.stat().st_size
                rebuilt.append(f"{match.group(1)}{match.group(2)}{public_src}{match.group(2)}")
            else:
                rebuilt.append(match.group(0))

            cursor = match.end()

        rebuilt.append(text[cursor:])
        output_html.write_text("".join(rebuilt), encoding="utf-8")

    return len([r for r in replacements if r[1]]), total_before, total_after


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, dest="input_html")
    parser.add_argument("--output", required=True, dest="output_html")
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()

    script_path = pathlib.Path(__file__).resolve()
    project_root = script_path.parents[1]
    input_html = pathlib.Path(args.input_html).resolve()
    output_html = pathlib.Path(args.output_html).resolve()

    try:
        image_count, total_before, total_after = process_html(
            input_html=input_html,
            output_html=output_html,
            slug=args.slug,
            project_root=project_root,
        )
    except Exception as exc:  # pragma: no cover - CLI error path
        print(f"エラー: {exc}", file=sys.stderr)
        return 1

    if image_count == 0:
        print("図版の変換対象は見つかりませんでした。")
        return 0

    print(f"図版を {image_count} 件変換しました。")
    if total_before > 0:
        print(f"  - 元画像合計: {total_before} bytes")
        print(f"  - 変換後合計: {total_after} bytes")
    print(f"  - 公開パス: {PUBLIC_IMAGE_PREFIX}/{args.slug}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
