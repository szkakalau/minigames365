#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAMES_DIR = ROOT / 'games'
MAIN_SNIPPET = '<script src="/assets/js/main.js"></script>'

re_gtag_event = re.compile(r"gtag\(\s*([\'\"])event\1\s*,\s*", re.IGNORECASE)
re_has_main = re.compile(r"<script[^>]+src=\"/assets/js/main\\.js\"[^>]*>\\s*</script>", re.IGNORECASE)

changed = []
for html_path in sorted(GAMES_DIR.glob('*/index.html')):
    try:
        text = html_path.read_text(encoding='utf-8')
    except Exception:
        continue

    original = text
    # Replace direct gtag('event', ...) with trackEvent(...)
    text = re_gtag_event.sub('trackEvent(', text)

    # If page uses trackEvent now or previously used gtag('event', ...), ensure main.js is included
    needs_main = ('trackEvent(' in text) or ("gtag('event'" in original or 'gtag("event"' in original)
    if needs_main and not re_has_main.search(text):
        lower = text.lower()
        idx = lower.rfind('</body>')
        insertion = '\n  ' + MAIN_SNIPPET + '\n'
        if idx != -1:
            text = text[:idx] + insertion + text[idx:]
        else:
            text = text.rstrip() + insertion + '\n'

    if text != original:
        html_path.write_text(text, encoding='utf-8')
        changed.append(str(html_path.relative_to(ROOT)))

print('Changed files:')
for f in changed:
    print('-', f)