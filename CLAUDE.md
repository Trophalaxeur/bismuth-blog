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
npm test         # unit tests (Vitest)
```

## Before pushing a PR

Always run these checks locally before pushing. All must pass:

```bash
npm test                  # unit tests
npm run build             # type-check + build
npm run lint:prettier     # formatter
npm run lint:eslint       # linter (0 errors required)
npm run lint:stylelint    # CSS linter (0 errors required)
```

## Publishing content

Content (articles, CV, docs) lives in carbon-notes and the project repos (gallium-homelab, neon-agents).
It is fetched at Vercel build time via Astro Content Layer loaders — no auto-publish on commit.
Full mechanics: [docs/content-pipeline.md](docs/content-pipeline.md).

After any content commit, trigger a rebuild manually:

```bash
blog-publish          # shell alias → Vercel Deploy Hook (preferred)
vercel deploy --prod  # alternative
```

## Conventions

- **Never run Prettier on `.md` files** (no `prettier --write *.md`, no `npm run lint:prettier` on Markdown). Markdown is intentionally excluded from the lint pipeline — keep it that way for ad-hoc edits too.

## Project structure

```
src/
  content.config.ts   # Astro Content Layer config — multi-repo GitHub loader, see docs/content-pipeline.md
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

| v5 | v6 |
|---|---|
| `entry.slug` | `entry.id.replace(/\.(md\|mdx)$/, '')` |
| `entry.render()` | `render(entry)` (import `render` from `astro:content`) |
| `import { z } from 'astro:content'` | `import { z } from 'zod'` |

## Site URL structure

```
/               → Landing page (short bio, markdown-driven)
/cv             → CV — version recruteur (2 pages, French default)
/cv/detailed    → CV — dossier de compétences (complet)
/cv/print       → Layout minimal pour export PDF (accepts ?variant=short|detailed|career-channel)
/cv/career-channel → CV — format réseau professionnel
/en/cv          → CV — recruiter version (English)
/en/cv/detailed → CV — detailed portfolio (English)
/en/cv/print    → Print layout (English)
/en/cv/career-channel → Professional network format (English)
/blog           → Blog articles in markdown
/tools          → Personal tools/stack
/contact        → Contact form + email
```

## CV architecture

Source of truth is `cv/` in the **carbon-notes** repo, split by locale — not a local `src/content/` folder. Fetched at build time via the custom GitHub loader (or read straight from disk in dev via `LOCAL_CARBON_NOTES`, see [docs/content-pipeline.md](docs/content-pipeline.md)):

```
cv/                         # in Trophalaxeur/carbon-notes
  fr/                       # French (source of truth)
    profile.md
    skills.md
    education.md
    projects.md
    extra-info.md
    interests.md
    domains.md
    summary.md
    experiences/
      YYYY-company.md       # one file per role
  en/                       # English (translated — same filenames)
    profile.md
    ...
    experiences/
      YYYY-company.md
```

- Two content collections, defined in `src/content.config.ts`: `cvSections` (`cv/{fr,en}/*.md`) + `cvExperiences` (`cv/{fr,en}/experiences/*.md`)
- Entry IDs are prefixed by locale: `fr/profile.md`, `en/experiences/2025-bluewhale.md` (the `cv/` prefix is stripped by the loader)
- Components filter by `Astro.currentLocale ?? 'fr'` to select the right locale entries
- Variant system: `:::short` / `:::detailed` / `:::career-channel` blocks in markdown, filtered by `extractVariantMarkdown()` in `src/utils/cv.ts`
- Rendered via `unified` (remark/rehype) + `set:html` — not standard Astro pipeline
- Experiences sorted by `priority` field then `start` date descending
- Components in `src/components/cv/`: CvPage, CvHeader, CvSkills, CvExperienceList, CvExperienceCard, CvDomains, CvSummary, CvAppendix, CvActions, CvLangSwitch, CvPrintButton, CvDownloadButton, CvCareerChannelCard
- PDF export of the CV (6 files, 3 variants × fr/en): [docs/cv/pdf-generation.md](docs/cv/pdf-generation.md)

## CV i18n

Astro i18n config (`astro.config.mjs`):
- `defaultLocale: 'fr'` — French served at `/cv/*` (no prefix)
- English served at `/en/cv/*`
- `prefixDefaultLocale: false`

To add a translation, create the English file at the same path as the French original but under `cv/en/` **in carbon-notes**, not in this repo. The file must keep identical frontmatter (same field names and values) — only the markdown body should be translated.

**Rules for translating a CV file from French to English:**

```
Translate the markdown body from French to English. Keep the following unchanged:
- All frontmatter (YAML between ---) — do not translate keys or values
- All :::short, :::detailed, :::career-channel block markers — keep them exactly as-is
- All **bold** / *italic* / bullet markers — preserve markdown syntax
- All proper nouns: company names, tool names (Angular, TypeScript, NestJS…), city names
- All links and email addresses
Only translate the human-readable prose inside the variant blocks.
```

## Site config

Personalise in `src/site.config.ts`:

- `siteConfig.author`, `.title`, `.description`, `.lang`
- `menuLinks` for nav

Also update `astro.config.mjs` → `site:` with the real domain.

## Content architecture (carbon-notes pipeline)

Content (articles, CV, docs) lives in separate private repos, fetched at build time via custom Astro Content Layer loaders (`src/loaders/github-loader.mjs`).

| Source | Repo | Collection |
|---|---|---|
| Articles FR | `Trophalaxeur/carbon-notes` `articles/**/fr/` | `postFr` |
| Articles EN | `Trophalaxeur/carbon-notes` `articles/**/en/` | `postEn` |
| CV | `Trophalaxeur/carbon-notes` `cv/{fr,en}/` | `cvSections`, `cvExperiences` |
| Docs homelab | `Trophalaxeur/gallium-homelab` `docs/` | `docs` (Starlight) |
| Docs neon | `Trophalaxeur/neon-agents` `docs/` | `docs` (Starlight) |

Auth: `CONTENT_TOKEN` env var (Vercel + local `.env`).

## Publishing content

After committing content in carbon-notes or a docs repo, trigger a Vercel rebuild:

```bash
blog-publish          # shell alias — preferred (configured in ~/.zshrc)
vercel deploy --prod  # alternative
```

bismuth-blog code commits auto-deploy via Vercel git integration. Only content-only changes need a manual trigger.
