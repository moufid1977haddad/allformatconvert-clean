# Legacy URL redirects — audit and fix (2026-09-01)

## Trigger

Google Search Console reported 4 URLs crawled 2026-07-12 to 2026-07-25 that
404 today:

- `https://onlineconvertools.com/tools/yaml-to-json`
- `https://onlineconvertools.com/tools/epub-to-pdf`
- `https://onlineconvertools.com/tools/file-encryptor`
- `https://www.onlineconvertools.com/tools/media-tools`

These are pre-categorization URLs. Every tool page has lived at
`/tools/<category>/<slug>` since this repo's history begins, so a flat
`/tools/<slug>` link is always stale.

## Method

GSC only reports what it has actually crawled — 4 URLs is not the full
picture. To find every route ever moved, two complementary methods were
used, since git's rename heuristic alone misses large reorganizations:

1. `git log --diff-filter=R -M --summary` for renames git's similarity
   heuristic did catch (works for small, isolated moves).
2. A full diff of every `page.*` path ever added (`git log --diff-filter=A
   --name-only`) against every `page.*` path that exists in the working
   tree today. Any historical path with no current file at that exact path
   is a route that moved or was removed — this catches bulk reorganizations
   that exceed git's rename-pairing limits, which the heuristic in (1)
   silently drops to plain add+delete pairs.

Method 2 found 33 historical paths with no current counterpart, all of
which paired cleanly to an existing current page:

- `app/login/page.jsx` → `app/signin/page.jsx` (1 rename, git-detected)
- `app/tools/image-converter/page.tsx`, `app/tools/image-editor/page.tsx` →
  moved under `app/tools/image-tools/`
- 28 `app/tools/media-tools/<slug>/page.jsx` files (real, live pages before
  being split into `audio-tools`, `gif-tools`, `video-tools` — commit
  `decc9bbd`) + the `media-tools` category index itself

Separately, `app/sitemap.ts` before commit `37d4528b` (2026-08-06, "fix:
sitemap and navbar links pointed at a nonexistent flat/media-tools path")
hardcoded a flat `/tools/<slug>` URL for all 172 tools that existed at the
time — every one of those was submitted to Google despite never having been
a real path. All 172 slugs still exist today, matched 1:1 against the
current `app/tools/<category>/<slug>` tree.

Total: 202 dead URLs → live-page pairs (172 flat + 28 `media-tools/<slug>`
+ 1 bare `media-tools` + `/login`). Zero were found with no current
successor (no tool has been removed outright since these URLs existed).

## `media-tools` category choice

No single current category fully replaces it (it mixed audio, video, and
GIF tools). Redirected to `/tools/video-tools`: it inherited the majority
of the split (15 of 28 pages — every video tool plus media-player,
screen-recorder, subtitle-generator) and "video" is the closer semantic
match to "media" than the narrower `audio-tools` or `gif-tools` splits.

## Internal links

Searched the live app tree for any remaining reference to a flat or
`media-tools` path (`href="/tools/<single-segment>"` and
`href="/tools/media-tools/..."`). None found — the only surviving
references are in three unused one-off scaffolding scripts at the repo
root (`create-media-tools.js`, `create-media-tools-real.js`,
`update-category-pages.js`), untouched since the initial 2026-05-30 import
and never imported by the app.

## Sitemap purity

`app/sitemap.ts` generates its URL list by walking the current
`app/tools/<category>/<slug>` filesystem tree, so it cannot reference a
path that doesn't exist. Verified empirically: every one of the 240 URLs
in the live `sitemap.xml` returns HTTP 200 (checked 2026-09-01) — no 404,
no redirect.

## The "3 pages with redirect" GSC report

Not from the sitemap (verified above — all 240 sitemap URLs are 200).
`onlineconvertools.com` (apex) is configured on Vercel to 301/308-redirect
to `www.onlineconvertools.com` — confirmed live (`curl -I
https://onlineconvertools.com/` → `308` → `Location:
https://www.onlineconvertools.com/`) — matching the canonical domain used
everywhere in the codebase (`metadataBase`, every page's `canonical`, the
sitemap's `baseUrl`). 3 of the 4 404 URLs GSC reported use the apex
(non-www) domain; GSC tracking a URL that redirects to www is this
already-correct canonicalization at work, not a bug. No domain-level
config was touched.

## Fix

`lib/legacyRedirects.ts` holds the 202 `{ source, destination, permanent:
true }` pairs, wired into `next.config.ts` via `redirects()`. All 202
destinations verified to have a live page file before commit.
