from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "icons" / "icon-512.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

source = Image.open(SOURCE).convert("RGBA")
for folder, size in SIZES.items():
    target_dir = RES / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(target_dir / "ic_launcher.png", "PNG", optimize=True)
    print(f"{folder}/ic_launcher.png {size}x{size}")