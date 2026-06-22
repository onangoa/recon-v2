#!/usr/bin/env python3
"""
Regenerate favicon / app icons from public/default_full_logo.png.

Targets (kept at their existing sizes):
  - public/icon.svg              -> 180x180 (embeds the mark as PNG data URI)
  - public/icon-light-32x32.png  -> 32x32   (mark on a dark background)
  - public/icon-dark-32x32.png   -> 32x32   (mark on a light background)
  - public/apple-icon.png        -> 180x180

The source logo is wide (4096x1080) and its content is centered, not on
the left. The script auto-detects the visible content bounding box and
fits it (preserving aspect ratio) into each square icon.

Requirements: Pillow  (pip install Pillow)
"""

from pathlib import Path
import base64
import io

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"

SOURCE = PUBLIC / "default_full_logo.png"

# Output targets:  (path, size, background RGBA)
TARGETS = [
    ("icon-light-32x32.png", 32, (15, 23, 42, 255)),   # dark bg
    ("icon-dark-32x32.png",  32, (248, 250, 252, 255)), # light bg
    ("apple-icon.png",      180, (255, 255, 255, 255)), # white
]

# Threshold for "transparent" when detecting content bbox.
ALPHA_MIN = 10
WHITE_MAX = 240  # pixels with all channels above this count as background


def content_bbox(img: Image.Image):
    """Bounding box of non-transparent, non-background pixels."""
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b, a = px[x, y]
            if a < ALPHA_MIN:
                continue
            if r >= WHITE_MAX and g >= WHITE_MAX and b >= WHITE_MAX:
                continue
            found = True
            minx = min(minx, x); maxx = max(maxx, x)
            miny = min(miny, y); maxy = max(maxy, y)
    if not found:
        return (0, 0, w, h)
    # expand by step to avoid clipping from sampling
    return (max(0, minx - step), max(0, miny - step),
            min(w, maxx + step), min(h, maxy + step))


def extract_logo(src: Image.Image) -> Image.Image:
    """Crop the source to its visible content bbox (keeps full logo)."""
    box = content_bbox(src)
    print(f"content bbox: {box}  ->  {box[2]-box[0]}x{box[3]-box[1]}")
    return src.crop(box).convert("RGBA")


def fit_to_square(img: Image.Image, size: int, bg, scale: float = 0.85) -> Image.Image:
    """Composite the (possibly wide) image into a square canvas, fit by width."""
    canvas = Image.new("RGBA", (size, size), bg)
    w, h = img.size
    target_w = int(size * scale)
    target_h = max(1, round(h * target_w / w))
    if target_h > size * scale:  # if too tall, scale down to fit height
        target_h = int(size * scale)
        target_w = max(1, round(w * target_h / h))
    mark = img.resize((target_w, target_h), Image.LANCZOS)
    offset = ((size - target_w) // 2, (size - target_h) // 2)
    canvas.alpha_composite(mark, offset)
    return canvas


def write_pngs(logo: Image.Image) -> None:
    for name, size, bg in TARGETS:
        out = fit_to_square(logo, size, bg)
        out.save(PUBLIC / name)
        print(f"wrote public/{name} ({size}x{size})")


def write_svg(logo: Image.Image) -> None:
    """Write icon.svg embedding the logo (180x180) as a PNG data URI."""
    size = 180
    png = fit_to_square(logo, size, (0, 0, 0, 0))  # transparent canvas

    buf = io.BytesIO()
    png.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    svg = (
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" '
        f'fill="none" xmlns="http://www.w3.org/2000/svg">\n'
        f'  <image href="data:image/png;base64,{b64}" '
        f'width="{size}" height="{size}"/>\n'
        f'</svg>\n'
    )
    (PUBLIC / "icon.svg").write_text(svg, encoding="utf-8")
    print(f"wrote public/icon.svg ({size}x{size})")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"source not found: {SOURCE}")
    src = Image.open(SOURCE).convert("RGBA")
    print(f"source: {SOURCE.name} {src.size}")
    logo = extract_logo(src)
    print(f"logo:   {logo.size}")
    write_pngs(logo)
    write_svg(logo)


if __name__ == "__main__":
    main()
