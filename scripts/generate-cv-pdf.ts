import { chromium, type Browser } from '@playwright/test';
import { preview } from 'astro';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

const PORT = (() => {
  const raw = process.env.PREVIEW_PORT ?? '4322';
  const port = parseInt(raw, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) throw new Error(`Invalid PREVIEW_PORT: "${raw}"`);
  return port;
})();

const BASE_URL = `http://localhost:${PORT}`;

// Self-hosted IBM Plex Sans (latin + latin-ext) declared once and reused for the
// 4 weights we render in print. Same .woff2 per subset for all weights because
// IBM Plex Sans is a variable font — Google Fonts declares 4 fixed-weight rules
// pointing to the same file, so we mirror that locally. Files live in
// `public/fonts/cv/` and are served by the preview server.
const IBM_PLEX_SANS_FACE_CSS = [400, 500, 600, 700]
  .flatMap((weight) => [
    `@font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: ${weight};
      font-display: block;
      src: url('${BASE_URL}/fonts/cv/ibm-plex-sans-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }`,
    `@font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: ${weight};
      font-display: block;
      src: url('${BASE_URL}/fonts/cv/ibm-plex-sans-latin-ext.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }`,
  ])
  .join('\n');

// name → page URL to capture. Output is written to public/cv-${name}.pdf so the files
// are served as static assets (dev + prod) and downloadable from the CV pages.
const TARGETS = [
  // printBackground=false → white paper, colored text/borders still render.
  { name: 'short', url: '/cv/print?variant=short', printBackground: false },
  { name: 'detailed', url: '/cv/print?variant=detailed', printBackground: true },
  { name: 'career-channel', url: '/cv/career-channel', printBackground: false },
  { name: 'short-en', url: '/en/cv/print?variant=short', printBackground: false },
  { name: 'detailed-en', url: '/en/cv/print?variant=detailed', printBackground: true },
  { name: 'career-channel-en', url: '/en/cv/career-channel', printBackground: false },
] as const;

type Target = (typeof TARGETS)[number];

async function generatePdf(browser: Browser, target: Target): Promise<void> {
  const url = `${BASE_URL}${target.url}`;
  const output = path.join(ROOT, 'public', `cv-${target.name}.pdf`);
  const page = await browser.newPage();
  try {
    // 'networkidle' ensures the Astro module script (variant toggle) has run
    await page.goto(url, { waitUntil: 'networkidle' });
    // Swap Satoshi → IBM Plex Sans for PDF generation only. Web visitors of
    // /cv/* still see Satoshi (site-wide consistency); IBM Plex Sans is used
    // exclusively at generation time because it emits cleaner glyph runs in
    // Chromium's headless `page.pdf()` pipeline than the variable Satoshi
    // (the latter shows visible gaps on s-t pairs like "Nes tJS").
    //
    // Fonts are self-hosted in `public/fonts/cv/` (offline-first: no Google
    // Fonts CDN dependency). The Tailwind v4 `@theme inline` block in app.css
    // bakes the literal font value into the `.font-satoshi` utility (no var()
    // indirection), so overriding `--font-satoshi` would have no effect. We
    // override the utility class itself with `!important` instead.
    await page.addStyleTag({ content: IBM_PLEX_SANS_FACE_CSS });
    await page.addStyleTag({
      content: ".font-satoshi { font-family: 'IBM Plex Sans', sans-serif !important; }",
    });
    // Wait for every @font-face to be fully loaded and applied, including the
    // freshly-injected IBM Plex Sans. Without this, the PDF can be captured
    // mid-swap and either render with the fallback font or scramble glyph
    // positions in the text layer.
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: output,
      printBackground: target.printBackground,
      // A4 fallback for pages without a CSS @page rule (career-channel);
      // pages that declare @page (CvPrintLayout: 15mm detailed / 10mm short
      // injected client-side) keep it via preferCSSPageSize.
      format: 'A4',
      preferCSSPageSize: true,
    });
    console.log(`  ✓ public/cv-${target.name}.pdf`);
  } finally {
    await page.close();
  }
}

console.log('▶ Starting preview server…');
const server = await preview({ root: ROOT, server: { port: PORT } });

try {
  const browser = await chromium.launch();
  try {
    await Promise.all(TARGETS.map((target) => generatePdf(browser, target)));
  } finally {
    await browser.close();
  }
} finally {
  await server.stop();
  console.log('Done.');
}
