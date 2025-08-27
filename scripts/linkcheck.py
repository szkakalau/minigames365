#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from urllib.parse import urlparse
from html.parser import HTMLParser

ROOT = "/Users/castroliu/Desktop/minigames"

# Tags and their attributes that may contain URLs
URL_ATTRS = {
    'a': ['href'],
    'link': ['href'],
    'script': ['src'],
    'img': ['src', 'srcset'],
    'source': ['src', 'srcset'],
    'video': ['src', 'poster'],
    'audio': ['src'],
    'iframe': ['src'],
}

SKIP_SCHEMES = ("javascript:", "mailto:", "tel:")

class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []  # list of (tag, attr, value)

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        if tag_lower in URL_ATTRS:
            for (k, v) in attrs:
                if k in URL_ATTRS[tag_lower] and v:
                    self.links.append((tag_lower, k, v))


def is_external(url: str) -> bool:
    p = urlparse(url)
    return bool(p.scheme and p.scheme in ("http", "https"))


def normalize_path(current_html_path: str, url: str) -> str:
    # strip query and fragment
    p = urlparse(url)
    path = p.path
    if not path:
        return ""
    if path.startswith('/'):
        abs_path = os.path.join(ROOT, path.lstrip('/'))
    else:
        base = os.path.dirname(current_html_path)
        abs_path = os.path.normpath(os.path.join(base, path))
    return abs_path


def path_exists_for_serving(abs_path: str) -> bool:
    # if exact file exists
    if os.path.isfile(abs_path):
        return True
    # if path is a directory, index.html should exist
    if os.path.isdir(abs_path):
        index_html = os.path.join(abs_path, 'index.html')
        if os.path.isfile(index_html):
            return True
    # if path without trailing slash but corresponding dir with index.html exists
    if not os.path.splitext(abs_path)[1]:
        # no extension, maybe directory
        if os.path.isdir(abs_path):
            index_html = os.path.join(abs_path, 'index.html')
            if os.path.isfile(index_html):
                return True
        # maybe missing trailing slash; try as directory name
        if os.path.isfile(abs_path + '.html'):
            return True
    return False


def collect_html_files(root: str):
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # skip hidden dirs (like .git if present)
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for f in filenames:
            if f.endswith('.html'):
                html_files.append(os.path.join(dirpath, f))
    return html_files


def main():
    html_files = collect_html_files(ROOT)
    broken = []
    checked = 0

    for html_path in html_files:
        try:
            with open(html_path, 'r', encoding='utf-8') as fp:
                content = fp.read()
        except Exception as e:
            print(f"[READ_ERR] {html_path}: {e}")
            continue

        parser = LinkCollector()
        try:
            parser.feed(content)
        except Exception as e:
            print(f"[PARSE_ERR] {html_path}: {e}")
            continue

        for tag, attr, url in parser.links:
            url_str = (url or '').strip()
            if not url_str:
                continue
            # skip schemes
            low = url_str.lower()
            if low.startswith(SKIP_SCHEMES):
                continue
            # ignore srcset multiple URLs (take first)
            if attr == 'srcset' and ',' in url_str:
                url_str = url_str.split(',')[0].strip().split(' ')[0]
            # external
            if is_external(url_str):
                continue
            # hash-only
            if url_str.startswith('#'):
                continue
            # normalize local path
            abs_path = normalize_path(html_path, url_str)
            if not abs_path:
                continue
            checked += 1
            if not path_exists_for_serving(abs_path):
                broken.append({
                    'file': os.path.relpath(html_path, ROOT),
                    'tag': tag,
                    'attr': attr,
                    'url': url,
                    'resolved_abs': os.path.relpath(abs_path, ROOT),
                })

    print("=== Link Check Report ===")
    print(f"HTML files scanned: {len(html_files)}")
    print(f"Internal links/resources checked: {checked}")
    print(f"Broken count: {len(broken)}")
    if broken:
        for i, b in enumerate(broken, 1):
            print(f"{i}. {b['file']} -> {b['attr']}='{b['url']}' (tag <{b['tag']}>) => {b['resolved_abs']}")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()