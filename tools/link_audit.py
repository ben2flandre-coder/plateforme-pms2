#!/usr/bin/env python3
from __future__ import annotations

import csv
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tools" / "link-report.csv"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        attrs_dict = dict(attrs)
        if tag == "a" and "href" in attrs_dict:
            self.links.append(attrs_dict["href"])
        if tag in {"img", "script"} and "src" in attrs_dict:
            self.links.append(attrs_dict["src"])
        if tag == "link" and "href" in attrs_dict:
            self.links.append(attrs_dict["href"])


def ignored(url: str) -> bool:
    if not url or url.startswith(("#", "javascript:", "mailto:", "tel:")):
        return True
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"}


def resolve(page: Path, url: str) -> Path:
    clean = url.split("#", 1)[0].split("?", 1)[0]
    return (page.parent / clean).resolve()


def iter_html() -> list[Path]:
    return sorted(
        p for p in ROOT.rglob("*.html") if "assets" not in p.parts
    )


def main() -> int:
    rows = []
    for page in iter_html():
        parser = LinkParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for url in parser.links:
            if ignored(url):
                continue
            resolved = resolve(page, url)
            exists = resolved.exists()
            rows.append(
                {
                    "page": page.relative_to(ROOT).as_posix(),
                    "url": url,
                    "resolved_path": resolved.relative_to(ROOT).as_posix() if resolved.is_relative_to(ROOT) else str(resolved),
                    "exists": str(exists).lower(),
                }
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["page", "url", "resolved_path", "exists"])
        writer.writeheader()
        writer.writerows(rows)

    broken = [r for r in rows if r["exists"] == "false"]
    print(f"Scanned {len(rows)} links across {len(iter_html())} pages.")
    print(f"Broken links: {len(broken)}")
    return 1 if broken else 0


if __name__ == "__main__":
    raise SystemExit(main())
