#!/usr/bin/env python3
"""API routing test.

There is no PHP binary in this environment, so the router in api.php is checked
the next best way: every preg_match route is read straight out of the real file
and exercised with the ids the admin panel actually sends. A route that only
accepts hex UUIDs silently 404s on any other id, which is exactly the "Could not
delete brand: Not found" class of bug.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
API = ROOT / 'api.php'


def load_routes():
    text = API.read_text(encoding='utf-8')
    routes = []
    pattern = re.compile(r"preg_match\('(#[^']+#[a-z]*)',\s*\$path,\s*\$m\)\s*&&\s*\$method === '([A-Z]+)'")
    for match in pattern.finditer(text):
        literal, method = match.group(1), match.group(2)
        body = literal[1:literal.rindex('#')]
        flags = literal[literal.rindex('#') + 1:]
        routes.append((re.compile(body[1:] + '$', re.IGNORECASE if 'i' in flags else 0), method))
    return routes


def main():
    routes = load_routes()
    failures = 0
    print('%d routes found in api.php' % len(routes))
    if len(routes) < 8:
        print('  FAIL route parsing broke — refusing to report success')
        return 1

    cases = [
        ('/brands/a1f0c3d2-0001-4a10-9a01-draftbrand0001', 'DELETE', 'plain uuid'),
        ('/brands/my_brand.2024', 'DELETE', 'imported slug'),
        ('/brands/Brand%20One', 'DELETE', 'url-encoded id'),
        ('/brands/one', 'PUT', 'short id'),
        ('/projects/b1f0c3d2-0001-4b10-9b01-draftproj0001', 'DELETE', 'plain uuid'),
        ('/projects/old-slug_2023', 'PUT', 'legacy slug'),
        ('/projects/b1/likes', 'GET', 'likes sub-resource'),
        ('/projects/b1/like', 'POST', 'like sub-resource'),
        ('/messages/abc123', 'DELETE', 'message id'),
    ]
    for path, method, label in cases:
        hit = any(route.match(path) and verb == method for route, verb in routes)
        if not hit:
            failures += 1
        print(('  ok   ' if hit else '  FAIL ') + '%-6s %-52s (%s)' % (method, path, label))

    # A trailing path segment must not be swallowed by the id route.
    guard = [('/brands/a/b', 'DELETE'), ('/projects/a/b/c', 'PUT')]
    for path, method in guard:
        hit = any(route.match(path) and verb == method for route, verb in routes)
        if hit:
            failures += 1
        print(('  ok   ' if not hit else '  FAIL ') + '%-6s %-52s (must not match)' % (method, path))

    print('\n%d passed, %d failed' % (len(cases) + len(guard) - failures, failures))
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
