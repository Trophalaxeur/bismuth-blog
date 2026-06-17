---
title: CV PDF Generation
description: How the CV is rendered into six PDF files — three variants times two locales — via a headless browser.
---

# CV PDF Generation

## What this is

`npm run cv:pdf` renders the CV as 6 static PDF files, one per variant × locale, using a headless Chromium browser against the built site. The output lands in `public/cv-*.pdf` and is committed — the CV pages link straight to those static files, no PDF generation happens at request time.

```bash
npm run cv:pdf
# = astro check && astro build, then:
# node --experimental-strip-types --no-warnings scripts/generate-cv-pdf.ts
```

The script is `scripts/generate-cv-pdf.ts`. Data comes from the `cvSections`/`cvExperiences` collections described in [content-pipeline.md](../content-pipeline.md) — regenerate the PDFs any time that content changes.

## The 6 targets

| Name | Locale | Variant | Route | `printBackground` | Output |
|---|---|---|---|---|---|
| `short` | fr | Recruiter-friendly, 2 pages | `/cv/print?variant=short` | `false` | `public/cv-short.pdf` |
| `detailed` | fr | Full competency dossier | `/cv/print?variant=detailed` | `true` | `public/cv-detailed.pdf` |
| `career-channel` | fr | Professional network format | `/cv/career-channel` | `false` | `public/cv-career-channel.pdf` |
| `short-en` | en | same as `short` | `/en/cv/print?variant=short` | `false` | `public/cv-short-en.pdf` |
| `detailed-en` | en | same as `detailed` | `/en/cv/print?variant=detailed` | `true` | `public/cv-detailed-en.pdf` |
| `career-channel-en` | en | same as `career-channel` | `/en/cv/career-channel` | `false` | `public/cv-career-channel-en.pdf` |

`short` and `detailed` share the same route (`/cv/print`) and the same `CvPrintLayout`/`CvPrintPage` components — both variants are rendered into the page at once (hidden via `display:none`), and a client-side script reads the `?variant=` query param to show the right one and hide the rest. The script also swaps in a tighter `10mm` page margin for `short` (vs the layout's `15mm` default) to fit it on 2 pages. This is why the generator waits for `networkidle` before printing: the visible variant is only correct after that script has run, not at initial HTML load.

`career-channel` is a separate dedicated route/component (`CvCareerChannelPage.astro`) with its own `15mm` `@page` rule — no variant switching involved.

## Why `printBackground` differs

Chromium's print pipeline strips CSS background colors by default unless `printBackground` is enabled. The `detailed` variant renders experience descriptions through `colorizeTechTerms()` (`src/utils/cv.ts`), which highlights technology terms with colored backgrounds — without `printBackground: true`, those highlights would disappear in the PDF. `short` and `career-channel` are designed to read cleanly without relying on background color, so they're generated on plain white paper.

## Font swap: Satoshi → IBM Plex Sans

The website uses Satoshi (variable font) everywhere, including `/cv/*`. The PDF generator overrides it to IBM Plex Sans, for PDF output only:

```ts
await page.addStyleTag({ content: IBM_PLEX_SANS_FACE_CSS });
await page.addStyleTag({
  content: ".font-satoshi { font-family: 'IBM Plex Sans', sans-serif !important; }",
});
await page.evaluate(() => document.fonts.ready);
```

Reasons:

- Chromium's headless `page.pdf()` pipeline renders the variable Satoshi font with visible glyph gaps on certain letter pairs (e.g. "s-t" in "NestJS"). IBM Plex Sans renders cleanly in the same pipeline.
- Tailwind v4's `@theme inline` block bakes the literal font name into the `.font-satoshi` utility class (no `var()` indirection), so the override has to target the class itself with `!important` rather than a CSS variable.
- IBM Plex Sans is self-hosted as WOFF2 in `public/fonts/cv/` (latin + latin-ext subsets, weights 400/500/600/700) — offline-first, no Google Fonts CDN dependency during generation.
- The script waits on `document.fonts.ready` before calling `page.pdf()`, otherwise the capture can race the font swap and either fall back to the wrong font or scramble glyph positions in the PDF's text layer.

## Adding a new variant or locale

1. Add the route/component if it doesn't exist yet (new variant) or confirm the `/en/...` route already renders the new locale (existing routes are locale-aware via `Astro.currentLocale`).
2. Add an entry to the `TARGETS` array in `scripts/generate-cv-pdf.ts` with its `name`, `url`, and `printBackground`.
3. If the new page needs specific print margins, set them via a CSS `@page` rule (component-level, like `CvCareerChannelPage.astro`) or client-side injection (like `CvPrintPage.astro`'s short-variant override) — `preferCSSPageSize: true` is already set globally so `@page` rules are respected.
4. Run `npm run cv:pdf` and check `public/cv-<name>.pdf`.

## Troubleshooting

- **`browserType.launch: Executable doesn't exist`** — Playwright's Chromium binary isn't installed. Run `npx playwright install chromium` once.
- **PDF still shows Satoshi / wrong font** — check the font files exist under `public/fonts/cv/`; the style tags are injected per-page, so a failed `page.addStyleTag` call would silently leave the default font.
- **`Invalid PREVIEW_PORT`** — set to an integer between 1 and 65535, or unset it to use the default `4322`.
