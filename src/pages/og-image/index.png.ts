import type { APIRoute } from 'astro';

import { siteConfig } from '@/site-config';
import { renderOgImage } from '@/utils';

export const GET: APIRoute = async () => {
  const png = await renderOgImage({ description: siteConfig.description, isArticle: false });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
