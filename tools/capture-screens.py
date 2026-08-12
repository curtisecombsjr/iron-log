#!/usr/bin/env python3
"""Capture full-page screenshots of iron-log over adb.

A phone screenshot only shows one viewport. This scrolls each tab to the
bottom, capturing as it goes, and stitches the frames into one tall image of
the whole page.

Stitching is done by measurement, not by assuming the swipe distance: Android
adds inertia, so the actual scroll per swipe varies. Each new frame is matched
against the previous one to find the true pixel shift, and only the genuinely
new rows are appended. Sticky chrome (status bar, app header, tab strip, nav
bar) is detected automatically — those rows are identical across frames — and
kept once rather than repeated down the image.

Usage:  capture-screens.py [--serial HOST:PORT] [--out DIR] [--width 540]
"""

from __future__ import annotations

import argparse
import io
import subprocess
import sys
import time

from PIL import Image

TABS = [("workout", 216), ("history", 538), ("trends", 888)]
TAB_Y = 334
MAX_FRAMES = 25
SETTLE = 1.2


def sh(serial: str, *args: str) -> None:
    subprocess.run(["adb", "-s", serial, "shell", *args],
                   check=True, capture_output=True)


def grab(serial: str) -> Image.Image:
    raw = subprocess.run(["adb", "-s", serial, "exec-out", "screencap", "-p"],
                         check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(raw)).convert("RGB")


def rows(img: Image.Image, width: int = 180) -> list[bytes]:
    """Downscaled grayscale rows — cheap, order-preserving row fingerprints."""
    h = img.height
    small = img.convert("L").resize((width, h), Image.BILINEAR)
    data = small.tobytes()
    return [data[i * width:(i + 1) * width] for i in range(h)]


def fixed_chrome(a: Image.Image, b: Image.Image) -> tuple[int, int]:
    """Leading/trailing rows that do not change when the page scrolls."""
    ra, rb = rows(a), rows(b)
    n = min(len(ra), len(rb))
    top = 0
    while top < n and ra[top] == rb[top]:
        top += 1
    bot = 0
    while bot < n - top and ra[-1 - bot] == rb[-1 - bot]:
        bot += 1
    return top, bot


def find_shift(prev: list[bytes], cur: list[bytes], max_shift: int) -> int:
    """How far the content moved up between two frames, in pixels.

    Scores each candidate shift by how many rows agree, so a partial match
    (new content entering at the bottom) still scores correctly.
    """
    best, best_score = 0, -1
    n = len(prev)
    for d in range(0, min(max_shift, n - 40)):
        overlap = n - d
        step = max(1, overlap // 120)          # sample rows for speed
        hits = total = 0
        for i in range(0, overlap, step):
            total += 1
            if prev[d + i] == cur[i]:
                hits += 1
        score = hits / max(1, total)
        if score > best_score:
            best, best_score = d, score
    return best if best_score > 0.75 else 0


def scroll_to_top(serial: str, w: int, h: int) -> None:
    for _ in range(12):
        sh(serial, "input", "swipe", str(w // 2), str(int(h * 0.35)),
           str(w // 2), str(int(h * 0.85)), "400")
    time.sleep(SETTLE)


def capture_page(serial: str, w: int, h: int) -> Image.Image:
    scroll_to_top(serial, w, h)
    first = grab(serial)

    # one probe swipe to learn what is sticky and how far a swipe travels
    sh(serial, "input", "swipe", str(w // 2), str(int(h * 0.80)),
       str(w // 2), str(int(h * 0.35)), "700")
    time.sleep(SETTLE)
    second = grab(serial)
    top, bot = fixed_chrome(first, second)
    if top >= first.height - 100:            # page does not scroll at all
        return first
    print(f"    sticky chrome: {top}px top, {bot}px bottom")

    def content(im):
        return im.crop((0, top, im.width, im.height - bot))

    canvas = content(first)
    prev_rows = rows(canvas)
    frames = 1

    cur = second
    while frames < MAX_FRAMES:
        c = content(cur)
        cur_rows = rows(c)
        shift = find_shift(prev_rows, cur_rows, c.height)
        if shift < 4:
            break
        new = c.crop((0, c.height - shift, c.width, c.height))
        merged = Image.new("RGB", (canvas.width, canvas.height + shift))
        merged.paste(canvas, (0, 0))
        merged.paste(new, (0, canvas.height))
        canvas = merged
        prev_rows = cur_rows
        frames += 1
        sh(serial, "input", "swipe", str(w // 2), str(int(h * 0.80)),
           str(w // 2), str(int(h * 0.35)), "700")
        time.sleep(SETTLE)
        cur = grab(serial)

    print(f"    stitched {frames} frames -> {canvas.height}px tall")
    out = Image.new("RGB", (first.width, top + canvas.height + bot))
    out.paste(first.crop((0, 0, first.width, top)), (0, 0))
    out.paste(canvas, (0, top))
    if bot:
        out.paste(first.crop((0, first.height - bot, first.width, first.height)),
                  (0, top + canvas.height))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--serial", default="192.168.1.103:39741")
    ap.add_argument("--out", default="docs/img/screenshots")
    ap.add_argument("--width", type=int, default=540,
                    help="downscale width for the committed image")
    args = ap.parse_args()

    import os
    os.makedirs(args.out, exist_ok=True)

    size = subprocess.run(["adb", "-s", args.serial, "shell", "wm", "size"],
                          check=True, capture_output=True, text=True).stdout
    w, h = (int(v) for v in size.strip().split()[-1].split("x"))
    print(f"device {args.serial}  {w}x{h}")

    for name, x in TABS:
        print(f"  [{name}]")
        sh(args.serial, "input", "tap", str(x), str(TAB_Y))
        time.sleep(SETTLE + 0.5)
        page = capture_page(args.serial, w, h)
        full = os.path.join(args.out, f"{name}-full.png")
        page.save(full)
        scale = args.width / page.width
        page.resize((args.width, int(page.height * scale)),
                    Image.LANCZOS).save(os.path.join(args.out, f"{name}.png"))
        print(f"    saved {name}.png ({args.width}x{int(page.height*scale)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
