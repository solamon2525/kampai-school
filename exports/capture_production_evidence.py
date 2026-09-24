# -*- coding: utf-8 -*-
"""แคปภาพหลักฐานจาก production เท่านั้น → exports/evidence/"""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "exports" / "evidence"
BASE = "https://kampai-school.vercel.app"

PAGES = [
    ("01-hub-homepage.png", f"{BASE}/"),
    ("02-edu-hub.png", f"{BASE}/educational-hub"),
    ("03-enrollment.png", f"{BASE}/enrollment"),
    ("04-staff.png", f"{BASE}/staff"),
    ("05-savings-bank.png", f"{BASE}/savings-bank"),
    ("06-waste-bank.png", f"{BASE}/waste-bank"),
    ("07-game-play.png", f"{BASE}/play/multiply-burst"),
]


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink(missing_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1.25,
            locale="th-TH",
        )
        page = context.new_page()
        for name, url in PAGES:
            log(f"capture {name} ← {url}")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(3500)
                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass
                page.wait_for_timeout(1500)
                dest = OUT / name
                page.screenshot(path=str(dest), full_page=False, type="png")
                size = dest.stat().st_size
                log(f"  -> {size} bytes")
                if size < 20_000:
                    log(f"  WARN small file: {name}")
            except Exception as exc:
                log(f"  FAIL {name}: {exc}")
        browser.close()

    log(f"done {OUT}")
    for f in sorted(OUT.glob("*.png")):
        log(f"  {f.name} {f.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
