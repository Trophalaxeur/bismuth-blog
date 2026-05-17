import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { siteConfig } from '@/site-config';

const W = 1200;
const H = 630;

const C = {
  bg: '#f7f8fc',
  text: '#111d2e',
  muted: '#3d4a5c',
  accent: '#1a6cb0',
};

const SITE_URL = new URL(siteConfig.url).hostname;
const SITE_NAME = siteConfig.siteName;
const AUTHOR = siteConfig.author;
const ROLE = siteConfig.role;
const BG_GRADIENT = `radial-gradient(ellipse at 100% 0%, rgba(26, 108, 176, 0.10) 0%, ${C.bg} 72%)`;

// Read once at module level — not per-image call
// process.cwd() is always the project root, unlike import.meta.url which shifts during prerender
const FONT_REGULAR = readFileSync(join(process.cwd(), 'public/fonts/og/Satoshi-Regular.otf'));
const FONT_BOLD = readFileSync(join(process.cwd(), 'public/fonts/og/Satoshi-Bold.otf'));
const BISMUTH_SRC = `data:image/png;base64,${readFileSync(join(process.cwd(), 'src/assets/bismuth.png')).toString('base64')}`;

type SatoriStyle = {
  display?: string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  alignItems?: string;
  alignSelf?: string;
  justifyContent?: string;
  width?: number | string;
  height?: number | string;
  background?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  lineHeight?: number | string;
  padding?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  borderRadius?: number | string;
};

type SatoriEl = {
  type: string;
  props: {
    style?: SatoriStyle;
    children?: string | SatoriEl | SatoriEl[];
    src?: string;
    width?: number;
    height?: number;
  };
};

function box(style: SatoriStyle, children?: SatoriEl | SatoriEl[]): SatoriEl {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children } };
}

function span(content: string, style: SatoriStyle): SatoriEl {
  return { type: 'span', props: { style, children: content } };
}

function img(src: string, width: number, height: number): SatoriEl {
  return { type: 'img', props: { src, width, height, style: { width, height } } };
}

function leftBar(): SatoriEl {
  return box({ width: 8, alignSelf: 'stretch', background: C.accent, flexShrink: 0 });
}

function topRow(): SatoriEl {
  return box({ alignItems: 'center' }, [
    img(BISMUTH_SRC, 104, 124),
    span(SITE_NAME, { color: C.accent, fontSize: 44, fontWeight: 700, marginLeft: 14 }),
  ]);
}

function bottomUrl(): SatoriEl {
  return box({ justifyContent: 'flex-end' }, [
    span(SITE_URL, { color: C.muted, fontSize: 36 }),
  ]);
}

function tagPill(tag: string): SatoriEl {
  return box(
    {
      background: 'rgba(26, 108, 176, 0.08)',
      borderRadius: 4,
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 12,
      paddingRight: 12,
      marginRight: 8,
    },
    [span(tag, { color: C.accent, fontSize: 18 })],
  );
}

function siteCard(description: string): SatoriEl {
  return box({ flexDirection: 'row', width: W, height: H, background: BG_GRADIENT, fontFamily: 'Satoshi' }, [
    leftBar(),
    box({ flexDirection: 'column', flexGrow: 1, padding: '52px 68px', justifyContent: 'space-between' }, [
      topRow(),
      box({ flexDirection: 'column', justifyContent: 'center' }, [
        span(AUTHOR, { color: C.text, fontSize: 68, fontWeight: 700, lineHeight: 1.1 }),
        span(ROLE, { color: C.accent, fontSize: 36, marginTop: 14, fontWeight: 700 }),
        box({ width: 56, height: 3, background: C.accent, marginTop: 28, marginBottom: 28 }),
        span(description, { color: C.muted, fontSize: 26, lineHeight: 1.5 }),
      ]),
      bottomUrl(),
    ]),
  ]);
}

function articleCard(title: string, description: string, date: string, tags: string[]): SatoriEl {
  const visibleTags = tags.slice(0, 2);

  return box({ flexDirection: 'row', width: W, height: H, background: BG_GRADIENT, fontFamily: 'Satoshi' }, [
    leftBar(),
    box({ flexDirection: 'column', flexGrow: 1, padding: '52px 68px', justifyContent: 'space-between' }, [
      topRow(),
      box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingTop: 20, paddingBottom: 20 }, [
        span(title, { color: C.text, fontSize: 48, fontWeight: 700, lineHeight: 1.2 }),
        span(description, { color: C.muted, fontSize: 24, lineHeight: 1.5, marginTop: 16 }),
        box({ width: 40, height: 3, background: C.accent, marginTop: 20, marginBottom: 16 }),
        span(AUTHOR, { color: C.text, fontSize: 26, fontWeight: 700 }),
        span(ROLE, { color: C.accent, fontSize: 20, fontWeight: 700, marginTop: 4 }),
      ]),
      box({ justifyContent: 'space-between', alignItems: 'center' }, [
        box({ alignItems: 'center' }, [
          ...visibleTags.map(tagPill),
          span(date, { color: C.muted, fontSize: 20, marginLeft: visibleTags.length > 0 ? 4 : 0 }),
        ]),
        span(SITE_URL, { color: C.muted, fontSize: 24 }),
      ]),
    ]),
  ]);
}

export async function renderOgImage(opts: {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  isArticle?: boolean;
}): Promise<ArrayBuffer> {
  const element = opts.isArticle
    ? articleCard(opts.title ?? '', opts.description ?? '', opts.date ?? '', opts.tags ?? [])
    : siteCard(opts.description ?? '');

  const svg = await satori(element, {
    width: W,
    height: H,
    fonts: [
      { name: 'Satoshi', data: FONT_REGULAR, weight: 400, style: 'normal' },
      { name: 'Satoshi', data: FONT_BOLD, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}
