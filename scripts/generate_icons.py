"""Generate the 动分 PWA icon set from one crisp vector-like master."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
SIZE = 1024

INK = (24, 51, 43)
INK_TOP = (31, 70, 57)
INK_BOTTOM = (14, 33, 27)
CORAL_TOP = (255, 147, 104)
CORAL_BOTTOM = (224, 82, 39)
CREAM = (255, 250, 241)


def radial_layer(
    size: int,
    center: tuple[int, int],
    radius: float,
    color: tuple[int, int, int, int],
    power: float = 2.0,
) -> Image.Image:
    """A soft radial light layer, used for depth without external assets."""
    yy, xx = np.mgrid[0:size, 0:size]
    distance = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    alpha = np.clip(1.0 - distance, 0.0, 1.0) ** power * color[3]
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[..., 0] = color[0]
    rgba[..., 1] = color[1]
    rgba[..., 2] = color[2]
    rgba[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    yy = np.linspace(0.0, 1.0, size, dtype=np.float32)[:, None]
    start = np.array(top, dtype=np.float32)
    end = np.array(bottom, dtype=np.float32)
    rgb = start[None, None, :] + (end - start)[None, None, :] * yy[:, :, None]
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[..., 3] = 255
    return Image.fromarray(rgba, "RGBA")


def build_master() -> Image.Image:
    # Background: a quiet forest gradient rather than a flat block.
    bg = vertical_gradient(SIZE, INK_TOP, INK_BOTTOM).convert("RGBA")
    bg = Image.alpha_composite(
        bg,
        radial_layer(SIZE, (820, 100), 760, (239, 106, 58, 92), power=2.2),
    )
    bg = Image.alpha_composite(
        bg,
        radial_layer(SIZE, (160, 920), 620, (255, 250, 241, 18), power=2.4),
    )

    # The three rising bars mirror the in-app brand mark.
    bars = [
        (282, 444, 112, 260, 0.72),
        (456, 264, 112, 440, 1.0),
        (630, 364, 112, 340, 0.86),
    ]
    mask = Image.new("L", (SIZE, SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    for x, y, width, height, _opacity in bars:
        mask_draw.rounded_rectangle((x, y, x + width, y + height), radius=52, fill=255)

    coral = vertical_gradient(SIZE, CORAL_TOP, CORAL_BOTTOM)
    bg.alpha_composite(Image.composite(coral, Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0)), mask))

    # A restrained baseline gives the mark a sense of a measured score.
    baseline = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    baseline_draw = ImageDraw.Draw(baseline)
    baseline_draw.rounded_rectangle((278, 748, 746, 766), radius=9, fill=(*CREAM, 38))
    bg = Image.alpha_composite(bg, baseline)
    return bg


def save_resized(master: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    master.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG", optimize=True)


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    master = build_master()
    save_resized(master, ICONS / "icon-192.png", 192)
    save_resized(master, ICONS / "icon-512.png", 512)
    save_resized(master, ICONS / "icon-maskable-512.png", 512)
    save_resized(master, PUBLIC / "apple-touch-icon.png", 180)
    master.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    # Small favicon keeps the same three-bar silhouette and stays legible at 16px.
    favicon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="coral" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff9368"/>
      <stop offset="1" stop-color="#e05227"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#18332b"/>
  <rect x="17" y="33" width="7" height="15" rx="3.5" fill="url(#coral)" opacity=".72"/>
  <rect x="28.5" y="20" width="7" height="28" rx="3.5" fill="url(#coral)"/>
  <rect x="40" y="27" width="7" height="21" rx="3.5" fill="url(#coral)" opacity=".88"/>
  <rect x="17" y="51" width="30" height="2" rx="1" fill="#fffaf1" opacity=".32"/>
</svg>
"""
    (PUBLIC / "favicon.svg").write_text(favicon, encoding="utf-8")

    # Keep a small preview sheet for human review.
    preview = Image.new("RGBA", (760, 260), (243, 239, 230, 255))
    preview.paste(master.resize((180, 180), Image.Resampling.LANCZOS), (38, 40), None)
    preview.paste(master.resize((96, 96), Image.Resampling.LANCZOS), (260, 82), None)
    preview.paste(master.resize((48, 48), Image.Resampling.LANCZOS), (392, 106), None)
    preview.paste(master.resize((24, 24), Image.Resampling.LANCZOS), (472, 118), None)
    preview.save(PUBLIC / "icon-preview.png", "PNG", optimize=True)

    print("Generated:")
    for path in [
        ICONS / "icon-192.png",
        ICONS / "icon-512.png",
        ICONS / "icon-maskable-512.png",
        PUBLIC / "apple-touch-icon.png",
        PUBLIC / "favicon.svg",
        PUBLIC / "favicon.ico",
        PUBLIC / "icon-preview.png",
    ]:
        print(f"  {path.relative_to(ROOT)}  ({path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
