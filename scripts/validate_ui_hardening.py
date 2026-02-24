#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob('*.html')) + sorted((ROOT / 'outils').glob('*.html'))
SVG_FILES = sorted(ROOT.rglob('*.svg'))
CORE_CSS = ROOT / 'assets/core/core.css'
NAV_JS = ROOT / 'assets/core/navigation.js'

SHAPE_TAGS = {'path', 'circle', 'rect', 'polygon', 'polyline', 'line', 'ellipse', 'use', 'image'}
LEGACY_SELECTORS = ['back-home', 'scroll-top', 'btn-scroll-left', 'btn-scroll-right', 'app-nav-bottom', 'legacy-nav', 'legacy-navigation', 'bottom-navigation', 'nav-buttons', 'navigation-links', 'data-nav-legacy']


def check_svg_not_empty() -> list[str]:
    issues: list[str] = []
    for svg in SVG_FILES:
        content = svg.read_text(encoding='utf-8', errors='ignore').strip()
        rel = svg.relative_to(ROOT)
        if not content:
            issues.append(f'SVG vide: {rel}')
            continue
        try:
            root = ET.fromstring(content)
        except ET.ParseError as exc:
            issues.append(f'SVG invalide: {rel} ({exc})')
            continue

        if not any(node.tag.split('}')[-1] in SHAPE_TAGS for node in root.iter()):
            issues.append(f'SVG sans formes: {rel}')
    return issues


def referenced_svgs() -> set[Path]:
    refs: set[Path] = set()
    pattern = re.compile(r'(?P<path>[./\w-]+\.svg)')
    for html in HTML_FILES:
        text = html.read_text(encoding='utf-8', errors='ignore')
        for match in pattern.finditer(text):
            raw = match.group('path')
            target = (html.parent / raw).resolve()
            if target.exists():
                refs.add(target)
    return refs


def check_referenced_svgs_not_empty() -> list[str]:
    issues: list[str] = []
    for target in sorted(referenced_svgs()):
        content = target.read_text(encoding='utf-8', errors='ignore').strip()
        rel = target.relative_to(ROOT)
        if not content:
            issues.append(f'SVG référencé vide: {rel}')
            continue
        try:
            root = ET.fromstring(content)
        except ET.ParseError:
            issues.append(f'SVG référencé invalide: {rel}')
            continue
        if not any(node.tag.split('}')[-1] in SHAPE_TAGS for node in root.iter()):
            issues.append(f'SVG référencé sans formes: {rel}')
    return issues


def check_html_includes() -> list[str]:
    issues: list[str] = []
    for html in HTML_FILES:
        text = html.read_text(encoding='utf-8', errors='ignore')
        rel = html.relative_to(ROOT)
        if 'assets/core/core.css' not in text and '../assets/core/core.css' not in text:
            issues.append(f'core.css manquant dans {rel}')
        if 'assets/core/navigation.js' not in text and '../assets/core/navigation.js' not in text:
            issues.append(f'navigation.js manquant dans {rel}')
    return issues


def check_navigation_neutralization() -> list[str]:
    issues: list[str] = []
    css_text = CORE_CSS.read_text(encoding='utf-8', errors='ignore')
    js_text = NAV_JS.read_text(encoding='utf-8', errors='ignore')

    if 'document.documentElement.dataset.nav = ' not in js_text:
        issues.append('navigation.js ne définit pas html[data-nav="core"]')

    if 'html[data-nav="core"]' not in css_text:
        issues.append('core.css ne contient aucun garde html[data-nav="core"]')

    for selector in LEGACY_SELECTORS:
        if selector == 'data-nav-legacy':
            needle = 'html[data-nav="core"] [data-nav-legacy]'
        else:
            needle = f'html[data-nav="core"] .{selector}'
        if needle not in css_text:
            issues.append(f'Neutralisation legacy absente: {needle}')

    for html in HTML_FILES:
        text = html.read_text(encoding='utf-8', errors='ignore')
        if 'navigation.js' not in text:
            continue
        has_legacy_markup = any(f'class="{s}' in text or f' {s}"' in text or f' {s} ' in text for s in LEGACY_SELECTORS[:-1]) or 'data-nav-legacy' in text
        if has_legacy_markup and 'html[data-nav="core"]' not in css_text:
            issues.append(f'Legacy détectée sans neutralisation core: {html.relative_to(ROOT)}')
    return issues


def main() -> int:
    checks = [
        ('SVG', check_svg_not_empty),
        ('SVG référencés', check_referenced_svgs_not_empty),
        ('Includes HTML', check_html_includes),
        ('Neutralisation navigation', check_navigation_neutralization),
    ]

    failures: list[str] = []
    for label, fn in checks:
        current = fn()
        if current:
            failures.append(f'[{label}]')
            failures.extend(f' - {line}' for line in current)

    if failures:
        print('❌ Validation UI hardening KO')
        print('\n'.join(failures))
        return 1

    print('✅ Validation UI hardening OK')
    print(f'Pages HTML vérifiées: {len(HTML_FILES)}')
    print(f'SVG vérifiés: {len(SVG_FILES)}')
    print(f'SVG référencés vérifiés: {len(referenced_svgs())}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
