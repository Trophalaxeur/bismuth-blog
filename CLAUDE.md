# Bismuth — Claude Code Notes

## Stack

- **Framework**: Astro 6.2.2 (static output)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (not `@astrojs/tailwind`)
- **Template base**: `srleom/astro-theme-resume`
- **Node**: v22.22.2 (pinned in `.nvmrc`)
- **Hosting target**: Vercel (static). Domain at online.net.

## Commands

```bash
npm run dev      # type-check watch + dev server → http://localhost:4321
npm run build    # astro check + astro build
npm run preview  # preview built output
npm run lint     # prettier + eslint fix
```

## Project structure

```
src/
  content.config.ts   # Astro Content Layer config (glob loader, z from zod)
  content/post/       # Blog posts (MD/MDX)
  site.config.ts      # Site metadata, menu links, expressive-code config
  styles/app.css      # TW4 entry point (@import "tailwindcss", @theme inline)
  pages/blog/[slug].astro
  layouts/BlogPost.astro
  components/blog/
    Hero.astro
    PostPreview.astro
```

## Tailwind v4 setup

`app.css` is the TW4 entry point. Colors are defined as CSS custom properties in `:root` / `.dark` and mapped to TW4 utilities via `@theme inline`:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
@variant dark (&:where(.dark, .dark *)); /* class-based dark mode */

@theme inline {
	--color-border: hsl(var(--border));
	/* ... all design tokens ... */
}
```

`tailwind.config.js` is still present at root but **not loaded by TW4** — it's dead weight and can be deleted.

## Astro v6 Content Layer

`src/content.config.ts` (not `src/content/config.ts`):

```ts
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'   // z is no longer re-exported from astro:content

const post = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/post' }),
  schema: ({ image }) => z.object({ ... })
})
```

## Astro v6 API changes (applied throughout)

| v5                                  | v6                                                     |
| ----------------------------------- | ------------------------------------------------------ |
| `entry.slug`                        | `entry.id.replace(/\.(md\|mdx)$/, '')`                 |
| `entry.render()`                    | `render(entry)` (import `render` from `astro:content`) |
| `import { z } from 'astro:content'` | `import { z } from 'zod'`                              |

## Site config

Personalise in `src/site.config.ts`:

- `siteConfig.author`, `.title`, `.description`, `.lang`
- `menuLinks` for nav

Also update `astro.config.mjs` → `site:` with the real domain.
