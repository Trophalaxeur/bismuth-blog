// Generates OG image previews without a full Astro build.
// Run with: npm run og:preview
// Output: tmp/og-preview-site.png and tmp/og-preview-article.png
import { mkdirSync, writeFileSync } from 'node:fs';

import { siteConfig } from '../src/site.config.ts';
import { renderOgImage } from '../src/utils/og-image.ts';

mkdirSync('./tmp', { recursive: true });

const site = await renderOgImage({ description: siteConfig.description, isArticle: false });
writeFileSync('./tmp/og-preview-site.png', Buffer.from(site));

const article = await renderOgImage({
  title: 'Mon article de test — un titre assez long pour voir le rendu',
  description: 'Description de test pour visualiser la mise en page de la carte article.',
  date: '12 mai 2026',
  tags: ['astro', 'satori'],
  isArticle: true,
});
writeFileSync('./tmp/og-preview-article.png', Buffer.from(article));

console.log('✓ tmp/og-preview-site.png');
console.log('✓ tmp/og-preview-article.png');
