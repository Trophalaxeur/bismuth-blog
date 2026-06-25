---
title: OG Images
description: Dynamic Open Graph image generation at build time using Satori and @resvg/resvg-js.
---

# OG Images — Dynamic generation with Satori

## What are OG images?

Open Graph (OG) is a protocol invented by Facebook in 2010. Meta tags in `<head>` tell social networks and messaging apps how to summarize a page when someone shares a link:

```html
<meta property="og:image" content="https://flefevre.fr/og-image/index.png" />
```

WhatsApp, Twitter/X, Slack, Discord, LinkedIn all crawl these tags to generate link previews. Without `og:image`, crawlers pick any image on the page or show nothing.

## Problem

The original template (`srleom/astro-theme-resume`) shipped with a static `public/social-card.png` — Sheng Rui's photo and bio. All link previews were showing the template author. Additionally, `BlogPost.astro` already referenced `/og-image/[slug].png` per article, but the route was never implemented.

## Solution

Dynamic OG image generation **at build time** using Satori + @resvg/resvg-js. Astro generates static PNG files for each page during `npm run build` — zero runtime cost.

## Technology choices

### Why Satori?

| Tool | Decision | Reason |
|---|---|---|
| `satori` + `@resvg/resvg-js` | ✅ Chosen | Lightweight, no browser, static-friendly, community standard for Astro |
| `@vercel/og` | ❌ Rejected | Designed for Next.js/serverless, drags in React as a dependency |
| `astro-og-canvas` | ❌ Rejected | Last release April 2024, limited customization, uses Canvas API not JSX-like objects |
| Puppeteer/Playwright | ❌ Rejected | 200MB+ Chrome dependency, overkill for build-time generation |

### Why @resvg/resvg-js?

Converts Satori's SVG output to PNG using a WebAssembly Rust renderer — no native system dependencies, unlike `sharp` which requires `librsvg` for SVG input.

### Font: why static OTF instead of the variable TTF?

Satori's internal `@shuding/opentype.js` cannot parse the `fvar` table in variable fonts. This is a known open issue ([vercel/satori#162](https://github.com/vercel/satori/issues/162), still unfixed as of May 2026). Using `Satoshi-Variable.ttf` causes:

```
TypeError: Cannot read properties of undefined (reading '260') at parseFvarAxis
```

The fix: use static weight files (`Satoshi-Regular.otf`, `Satoshi-Bold.otf`) from [fontshare.com](https://www.fontshare.com/fonts/satoshi). They were downloaded once via the Fontshare API:

```bash
curl -sL "https://api.fontshare.com/v2/fonts/download/satoshi" -o /tmp/satoshi.zip
unzip -j /tmp/satoshi.zip \
  "Satoshi_Complete/Fonts/OTF/Satoshi-Regular.otf" \
  "Satoshi_Complete/Fonts/OTF/Satoshi-Bold.otf" \
  -d public/fonts/og/
```

## Architecture

```
src/
  utils/og-image.ts          # Core renderer — Satori layout + resvg-js PNG output
  pages/og-image/
    index.png.ts             # Static route → site OG image (home, CV, contact…)
    [slug].png.ts            # Dynamic route → one PNG per blog post
scripts/
  og-preview.ts              # Standalone preview generator (bypasses Astro build)
public/
  fonts/og/
    Satoshi-Regular.otf      # Static font for Satori (variable TTF not supported)
    Satoshi-Bold.otf
src/
  assets/bismuth.png         # Logo — loaded as base64 data URL at module level
```

### `BaseHead.astro` wiring

```ts
// Falls back to /og-image/index.png for non-article pages
const socialImageURL = new URL(ogImage ? ogImage : '/og-image/index.png', Astro.url).href;
```

### `BlogPost.astro` wiring

```ts
// Each article points to its own generated image
const socialImage = ogImage ?? `/og-image/${slug}.png`;
```

## Card designs

Two layouts share the same design tokens, gradient, and top bar (bismuth logo + "Dev Notes"):

**Site card** (`/og-image/index.png`):
```
[8px blue bar] | Dev Notes (logo)
               | Florian Lefevre (68px bold)
               | Tech Lead / Engineering Manager (hands-on) (36px bold)
               | ── blue divider ──
               | site description (26px)
               |                              flefevre.fr
```

**Article card** (`/og-image/[slug].png`):
```
[8px blue bar] | Dev Notes (logo)         flefevre.fr
               |
               | Article title (52px bold)
               | Article description (26px)
               |
               | [tag1] [tag2]  date       flefevre.fr
```

## Updating the design

All design tokens live at the top of `src/utils/og-image.ts`:

```ts
const C = { bg, text, muted, accent }          // color palette
const SITE_URL = 'flefevre.fr'
const SITE_NAME = 'Dev Notes'
const AUTHOR = 'Florian Lefevre'
const ROLE = 'Tech Lead / Engineering Manager (hands-on)'
const BG_GRADIENT = '...'                       // radial gradient CSS string
```

Fonts and the bismuth image are loaded **once at module level** — not on each image generation call.

After editing, run `npm run og:preview` to check the result before building.

## Preview without full build

```bash
npm run og:preview
# Generates: tmp/og-preview-site.png
#            tmp/og-preview-article.png
```

Uses `node --experimental-strip-types` (Node ≥ 22.6) — no `tsx` or `ts-node` required. The `tmp/` directory is git-ignored.

## Known Satori limitations

- Flexbox only — no CSS Grid, no `position: absolute`
- No WOFF2 — use TTF, OTF, or WOFF
- Variable fonts crash the parser — use static weight files
- `border` shorthand can be unreliable — prefer `paddingTop/Bottom/Left/Right` individually
- No `text-overflow: ellipsis` — truncate strings in JS before passing to the layout
