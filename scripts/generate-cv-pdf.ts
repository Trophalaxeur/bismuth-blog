import { preview } from 'astro';
import { chromium, type Browser } from '@playwright/test';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

const PORT = (() => {
  const raw = process.env.PREVIEW_PORT ?? '4322';
  const port = parseInt(raw, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535)
    throw new Error(`Invalid PREVIEW_PORT: "${raw}"`);
  return port;
})();

const BASE_URL = `http://localhost:${PORT}`;
const VARIANTS = ['short', 'detailed'] as const;

type Variant = (typeof VARIANTS)[number];

async function generatePdf(browser: Browser, variant: Variant): Promise<void> {
  const url = `${BASE_URL}/cv/print?variant=${variant}`;
  const output = path.join(ROOT, 'dist', `cv-${variant}.pdf`);
  const page = await browser.newPage();
  try {
    // 'networkidle' ensures the Astro module script (variant toggle) has run
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.pdf({
      path: output,
      printBackground: true,
      // Use @page { size: A4; margin: 15mm } from CvPrintLayout.astro
      preferCSSPageSize: true,
    });
    console.log(`  ✓ dist/cv-${variant}.pdf`);
  } finally {
    await page.close();
  }
}

console.log('▶ Starting preview server…');
const server = await preview({ root: ROOT, server: { port: PORT } });

try {
  const browser = await chromium.launch();
  try {
    await Promise.all(VARIANTS.map((variant) => generatePdf(browser, variant)));
  } finally {
    await browser.close();
  }
} finally {
  await server.stop();
  console.log('Done.');
}
