#!/usr/bin/env python3
"""Generate fixed, white-background Sophis Central browser and PWA PNG icons."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "sophia-central-mark.png"


def render_icon(size: int, scale: float = 0.78) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    max_edge = int(size * scale)
    source.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    x = (size - source.width) // 2
    y = (size - source.height) // 2
    canvas.alpha_composite(source, (x, y))
    return canvas.convert("RGB")


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing source mark: {SOURCE}")

    # Browser favicon: standard square PNG, with the mark centered on white.
    render_icon(512, 0.82).save(PUBLIC / "sophis-central-favicon.png", optimize=True)
    render_icon(32, 0.82).save(PUBLIC / "sophis-central-favicon-32.png", optimize=True)
    render_icon(48, 0.82).save(PUBLIC / "sophis-central-favicon-48.png", optimize=True)

    # Apple touch icon: dedicated 180 x 180 opaque PNG.
    render_icon(180, 0.78).save(PUBLIC / "apple-touch-icon.png", optimize=True)

    # Android Chrome install icons.
    render_icon(192, 0.78).save(PUBLIC / "sophis-central-192.png", optimize=True)
    render_icon(512, 0.78).save(PUBLIC / "sophis-central-512.png", optimize=True)

    # Maskable icon uses a conservative 20% safe margin for launcher masking.
    render_icon(512, 0.64).save(PUBLIC / "sophis-central-maskable-512.png", optimize=True)

    # Multi-resolution ICO for legacy desktop browsers.
    render_icon(256, 0.82).save(
        PUBLIC / "sophis-central-favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    print("Generated white-background Sophis icon assets:")
    for name in (
        "apple-touch-icon.png",
        "sophis-central-favicon.png",
        "sophis-central-favicon-32.png",
        "sophis-central-favicon-48.png",
        "sophis-central-favicon.ico",
        "sophis-central-192.png",
        "sophis-central-512.png",
        "sophis-central-maskable-512.png",
    ):
        image = Image.open(PUBLIC / name)
        print(f"  {name}: {image.size}, {image.mode}")


if __name__ == "__main__":
    main()
