#!/usr/bin/env python3
"""Validate generated Sophis browser, iOS and Android icon assets."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
EXPECTED = {
    "apple-touch-icon.png": (180, 180),
    "sophis-central-favicon.png": (512, 512),
    "sophis-central-favicon-32.png": (32, 32),
    "sophis-central-favicon-48.png": (48, 48),
    "sophis-central-192.png": (192, 192),
    "sophis-central-512.png": (512, 512),
    "sophis-central-maskable-512.png": (512, 512),
}

for filename, size in EXPECTED.items():
    path = PUBLIC / filename
    if not path.is_file():
        raise SystemExit(f"FAIL: missing {filename}")
    with Image.open(path) as image:
        if image.format != "PNG" or image.size != size:
            raise SystemExit(f"FAIL: {filename} expected PNG {size}, got {image.format} {image.size}")
        rgb = image.convert("RGB")
        corners = [rgb.getpixel(point) for point in ((0, 0), (size[0]-1, 0), (0, size[1]-1), (size[0]-1, size[1]-1))]
        if any(channel < 250 for pixel in corners for channel in pixel):
            raise SystemExit(f"FAIL: {filename} does not have a clean white canvas at all corners")
    print(f"PASS: {filename} {size[0]}x{size[1]}")

manifest = json.loads((PUBLIC / "manifest.webmanifest").read_text(encoding="utf-8"))
icons = manifest.get("icons", [])
required = {
    ("/sophis-central-192.png", "192x192", "any"),
    ("/sophis-central-512.png", "512x512", "any"),
    ("/sophis-central-maskable-512.png", "512x512", "maskable"),
}
actual = {(item.get("src"), item.get("sizes"), item.get("purpose")) for item in icons}
if not required.issubset(actual):
    raise SystemExit("FAIL: Android manifest is missing required any/maskable PNG icon declarations")

html = (ROOT / "index.html").read_text(encoding="utf-8")
if 'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"' not in html:
    raise SystemExit("FAIL: iOS Apple Touch Icon declaration is missing")
if 'href="/sophis-central-favicon-32.png"' not in html or 'href="/sophis-central-favicon-48.png"' not in html:
    raise SystemExit("FAIL: browser PNG favicon declarations are missing")

print("PASS: iOS declaration and Android PWA manifest")
