#!/usr/bin/env python3
"""tools/build-fa-page.py — generate fa.html from index.html + data/ui-strings.json

One source of truth
-------------------
index.html is the only page that is edited by hand. This script produces its
Persian twin:

  * <html lang="en">            -> <html lang="fa" dir="rtl">
  * [data-i18n="key"] text      -> ui-strings.json  fa[key]
  * [data-i18n-placeholder]     -> fa[key]
  * [data-i18n-label]           -> fa[key]
  * [data-setting="key"] text   -> settings.json   keyFa   (when non-empty)
  * canonical/og/hreflang links -> point at the Persian page

The CMS then overrides everything at runtime on both pages, so the generated
file only has to be right for the first paint and for search engines.
Everything a script renders (work cards, services, process, rates, timelines)
is filled by js/work.js, which reads the CMS and picks the *Fa mirror itself.
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://alirezashabanzadeh.com'

INDEX = ROOT / 'index.html'
TARGET = ROOT / 'fa.html'
STRINGS = ROOT / 'data' / 'ui-strings.json'
SETTINGS = ROOT / 'data' / 'settings.json'


def load(path):
    with path.open(encoding='utf-8') as fh:
        return json.load(fh)


def split_attrs(tag):
    """Yield (name, value, start, end) for every attribute in an opening tag."""
    for match in re.finditer(r'([:\w-]+)\s*=\s*"([^"]*)"', tag):
        yield match.group(1), match.group(2), match.start(), match.end()


def transform_tag(tag, fa_strings, settings, counters):
    attrs = list(split_attrs(tag))
    values = {name: value for name, value, _, _ in attrs}

    # Language specific attributes first.
    if 'data-i18n' in values and values['data-i18n'] in fa_strings:
        counters['i18n'] += 1
        if 'data-setting' in values:
            key = values['data-setting']
            mirror = settings.get(key + 'Fa')
            if isinstance(mirror, str) and mirror.strip():
                return tag, fa_strings[values['data-i18n']], True
        return tag, fa_strings[values['data-i18n']], True
    return tag, None, False


def set_attr(tag, name, value):
    pattern = re.compile(r'(\s' + re.escape(name) + r'\s*=\s*)"[^"]*"')
    if pattern.search(tag):
        return pattern.sub(lambda m: m.group(1) + '"' + value + '"', tag, count=1)
    return tag[:-1] + ' ' + name + '="' + value + '">'


def indentation_before(text, index):
    line_start = text.rfind('\n', 0, index) + 1
    return text[line_start:index]


def replace_text_inside(text, start, end, new_text):
    """Replace the character data of the element that opens at `start` and
    closes at `end`, keeping its child markup (icons, spans) untouched."""
    inner = text[start:end]
    # Only replace when the element holds plain text: tags mean the copy lives
    # in children, each of which is transformed on its own pass.
    if '<' in inner:
        return None
    lead = re.match(r'\s*', inner).group(0)
    trail = re.search(r'\s*$', inner).group(0)
    return lead + html.escape(new_text, quote=False) + trail


def rewrite_attributes(text, fa_strings, settings, counters):
    def repl(match):
        tag = match.group(0)
        values = {name: value for name, value, _, _ in split_attrs(tag)}

        if 'data-i18n-placeholder' in values:
            key = values['data-i18n-placeholder']
            if key in fa_strings:
                counters['placeholder'] += 1
                tag = set_attr(tag, 'placeholder', html.escape(fa_strings[key], quote=True))
        if 'data-i18n-label' in values:
            key = values['data-i18n-label']
            if key in fa_strings:
                counters['label'] += 1
                tag = set_attr(tag, 'aria-label', html.escape(fa_strings[key], quote=True))
        if 'data-i18n-title' in values:
            key = values['data-i18n-title']
            if key in fa_strings:
                counters['title'] += 1
                tag = set_attr(tag, 'title', html.escape(fa_strings[key], quote=True))
        return tag

    return re.sub(r'<[a-zA-Z][^>]*>', repl, text)


def swap_text_nodes(text, fa_strings, settings, counters):
    """Replace the text of [data-i18n] elements that hold nothing but text."""
    out = []
    cursor = 0
    tag_pattern = re.compile(r'<([a-zA-Z][\w-]*)((?:\s+[:\w-]+\s*=\s*"[^"]*")*)\s*>')
    void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
            'meta', 'param', 'source', 'track', 'wbr'}

    while True:
        match = tag_pattern.search(text, cursor)
        if not match:
            break
        tag = match.group(0)
        name = match.group(1).lower()
        attrs = {n: v for n, v, _, _ in split_attrs(tag)}
        key = attrs.get('data-i18n')
        if not key or name in void:
            out.append(text[cursor:match.end()])
            cursor = match.end()
            continue

        close_index = text.find('</' + name + '>', match.end())
        if close_index == -1:
            out.append(text[cursor:match.end()])
            cursor = match.end()
            continue

        inner = text[match.end():close_index]
        setting_key = attrs.get('data-setting')
        replacement = None
        if setting_key:
            mirror = settings.get(setting_key + 'Fa')
            if isinstance(mirror, str) and mirror.strip():
                replacement = mirror
        if replacement is None and key in fa_strings:
            replacement = fa_strings[key]

        if replacement is not None and '<' not in inner:
            counters['text'] += 1
            out.append(text[cursor:match.end()])
            out.append(replace_text_inside(text, match.end(), close_index, replacement))
            cursor = close_index
            continue

        out.append(text[cursor:match.end()])
        cursor = match.end()

    out.append(text[cursor:])
    return ''.join(out)


def swap_setting_nodes(text, settings, counters):
    """Fill [data-setting] text nodes from the *Fa mirror in settings.json."""
    tag_pattern = re.compile(r'<([a-zA-Z][\w-]*)((?:\s+[:\w-]+\s*=\s*"[^"]*")*)\s*>')
    void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
            'meta', 'param', 'source', 'track', 'wbr'}
    out, cursor = [], 0
    while True:
        match = tag_pattern.search(text, cursor)
        if not match:
            break
        name = match.group(1).lower()
        attrs = {n: v for n, v, _, _ in split_attrs(match.group(0))}
        key = attrs.get('data-setting')
        if not key or name in void or 'data-i18n' in attrs:
            out.append(text[cursor:match.end()])
            cursor = match.end()
            continue
        close_index = text.find('</' + name + '>', match.end())
        if close_index == -1:
            out.append(text[cursor:match.end()])
            cursor = match.end()
            continue
        inner = text[match.end():close_index]
        mirror = settings.get(key + 'Fa')
        out.append(text[cursor:match.end()])
        if isinstance(mirror, str) and mirror.strip() and '<' not in inner:
            counters['setting'] += 1
            out.append(replace_text_inside(text, match.end(), close_index, mirror))
        else:
            out.append(inner)
        cursor = close_index
    out.append(text[cursor:])
    return ''.join(out)


def build():
    fa_strings = load(STRINGS)['fa']
    settings = load(SETTINGS)
    text = INDEX.read_text(encoding='utf-8')

    counters = {'text': 0, 'placeholder': 0, 'label': 0, 'title': 0, 'i18n': 0, 'setting': 0}

    text = text.replace('<html lang="en" dir="ltr"', '<html lang="fa" dir="rtl"')
    text = text.replace('<html lang="en"', '<html lang="fa" dir="rtl"')
    html_tag = re.search(r'<html\b[^>]*>', text).group(0)
    if 'dir="rtl"' not in html_tag or 'lang="fa"' not in html_tag:
        raise SystemExit('could not set lang/dir on <html>')

    text = text.replace('index.html', 'fa.html')
    text = text.replace('.html" hreflang="fa"', '.html" hreflang="fa"')  # no-op guard

    # The language links must point at the *other* page, not at themselves.
    # The blanket replace above turns the footer/mobile "فارسی" link
    # (href="fa.html") into a self-link on the Persian page; fix both back
    # to the English page with an English label.
    text = text.replace(
        '<a href="fa.html" hreflang="fa" lang="fa" dir="rtl" class="footer-lang">فارسی</a>',
        '<a href="index.html" hreflang="en" lang="en" class="footer-lang">English</a>')
    text = text.replace(
        '<a href="fa.html" hreflang="fa" lang="fa" dir="rtl" class="mobile-lang-link" data-i18n="langToggleLabel">فارسی</a>',
        '<a href="index.html" hreflang="en" lang="en" class="mobile-lang-link" data-i18n="langToggleLabel">English</a>')

    # <title>, meta description, canonical, hreflang, og:url
    text = text.replace('<title>', '<title>')
    title_fa = settings.get('siteNameFa') or 'علیرضا شعبان‌زاده'
    title_role = settings.get('siteTitleFa') or 'طراح موشن'
    text = re.sub(r'<title>.*?</title>', '<title>' + title_fa + ' — ' + title_role + '</title>', text, count=1)
    text = re.sub(r'(<link rel="canonical" href=")[^"]*(")', r'\g<1>' + SITE + '/fa.html' + r'\g<2>', text)
    text = re.sub(r'(<meta property="og:url" content=")[^"]*(")', r'\g<1>' + SITE + '/fa.html' + r'\g<2>', text)
    text = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  r'\g<1>' + title_fa + ' — ' + title_role + r'\g<2>', text)
    text = re.sub(r'(<link rel="alternate" hreflang="en" href=")[^"]*(")',
                  r'\g<1>' + SITE + '/index.html' + r'\g<2>', text)
    text = re.sub(r'(<link rel="alternate" hreflang="fa" href=")[^"]*(")',
                  r'\g<1>' + SITE + '/fa.html' + r'\g<2>', text)

    # A dedicated URL must never redirect the visitor away from itself.
    text = text.replace('<html lang="fa" dir="rtl"', '<html lang="fa" dir="rtl" data-no-redirect', 1)

    text = rewrite_attributes(text, fa_strings, settings, counters)
    text = swap_text_nodes(text, fa_strings, settings, counters)
    text = swap_setting_nodes(text, settings, counters)

    TARGET.write_text(text, encoding='utf-8')

    # ------------------------------------------------------------------ guard
    left_english = []
    for match in re.finditer(r'<([a-zA-Z][\w-]*)((?:\s+[:\w-]+\s*=\s*"[^"]*")*)\s*>([^<]*)', text):
        name = match.group(1).lower()
        if name in {'script', 'style', 'svg', 'path', 'title'}:
            continue
        body = match.group(3).strip()
        if len(body) < 4 or not re.search(r'[A-Za-z]{3,}', body):
            continue
        # Latin-only fragments such as the time zone, an e-mail address or a
        # brand name are correct on a Persian page; prose is not.
        if not re.search(r'(?:[A-Za-z][a-z]+\s+){2,}[A-Za-z]', body):
            continue
        attrs = {n: v for n, v, _, _ in split_attrs(match.group(0))}
        if 'data-i18n' in attrs or 'data-setting' in attrs:
            key = attrs.get('data-i18n') or ''
            if key in fa_strings:
                continue
            left_english.append(body[:60])
        elif 'data-setting' in attrs:
            continue

    print('fa.html built')
    print('  text nodes translated :', counters['text'])
    print('  placeholders           :', counters['placeholder'])
    print('  aria-labels            :', counters['label'])
    print('  CMS mirrors (*Fa)      :', counters['setting'])
    if left_english:
        print('  WARNING: English text left in', len(left_english), 'node(s):')
        for snippet in left_english[:12]:
            print('    -', snippet)
    return 0


if __name__ == '__main__':
    sys.exit(build())
