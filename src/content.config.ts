import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { githubLoader } from './loaders/github-loader.mjs';

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

const CONTENT_TOKEN = import.meta.env.CONTENT_TOKEN;
const CARBON_NOTES = 'Trophalaxeur/carbon-notes';
// Dev-only override — never honored in builds (preview/production), so an accidentally-set
// env var on a deploy platform can't silently swap GitHub fetch for a local path that doesn't exist there.
const LOCAL_CARBON_NOTES = import.meta.env.DEV ? (import.meta.env.LOCAL_CARBON_NOTES as string | undefined) : undefined;

// Sub-selector for LOCAL_CARBON_NOTES: when set (by bromine-backend's PDF
// render step), points cvSections/cvExperiences at a one-off tailored dataset
// instead of the real cv/{fr,en}/. Same DEV-only gating as LOCAL_CARBON_NOTES
// itself — never honored in a build, so it can never leak into production.
// Requires LOCAL_CARBON_NOTES to also be set (it's a sub-selector, not an
// independent mechanism).
const TAILORED_CV_SLUG = import.meta.env.DEV ? (import.meta.env.TAILORED_CV_SLUG as string | undefined) : undefined;
if (TAILORED_CV_SLUG && !/^[a-z0-9-]+$/i.test(TAILORED_CV_SLUG)) {
  throw new Error(`Invalid TAILORED_CV_SLUG: "${TAILORED_CV_SLUG}" — must match /^[a-z0-9-]+$/`);
}

// cv/tailored/<slug>/ mirrors cv/'s own {fr,en}/ shape exactly (prefix kept —
// see docs/cv/pdf-generation-tailored.md — so CvPage's existing
// `e.id.startsWith(locale + '/')` filter needs no change).
const CV_BASE = LOCAL_CARBON_NOTES && TAILORED_CV_SLUG ? `${LOCAL_CARBON_NOTES}/cv/tailored/${TAILORED_CV_SLUG}` : LOCAL_CARBON_NOTES ? `${LOCAL_CARBON_NOTES}/cv` : undefined;

// coverImage.src is a CDN URL string — remote content can't use Astro's image() helper
const postSchema = z.object({
  title: z.string().max(60),
  description: z.string().min(50).max(160),
  publishDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  updatedDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  coverImage: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
  ogImage: z.string().optional(),
});

const postFr = defineCollection({
  loader: githubLoader({
    repo: CARBON_NOTES,
    pathPattern: 'articles/*/fr/index.{md,mdx}',
    token: CONTENT_TOKEN,
  }),
  schema: postSchema,
});

const postEn = defineCollection({
  loader: githubLoader({
    repo: CARBON_NOTES,
    pathPattern: 'articles/*/en/index.{md,mdx}',
    token: CONTENT_TOKEN,
  }),
  schema: postSchema,
});

const cvExperiences = defineCollection({
  loader: CV_BASE
    ? glob({ pattern: '{fr,en}/experiences/*.md', base: CV_BASE })
    : githubLoader({
        repo: CARBON_NOTES,
        pathPattern: 'cv/{fr,en}/experiences/*.md',
        token: CONTENT_TOKEN,
        stripPrefix: 'cv/',
      }),
  schema: z.object({
    schemaVersion: z.number().optional(),
    type: z.literal('experience'),
    company: z.string(),
    clientLocation: z.string().optional(),
    employer: z.string().optional(),
    role: z.string(),
    start: z.string(),
    end: z.string().optional(),
    current: z.boolean().optional().default(false),
    priority: z.number().optional().default(50),
    variants: z.array(z.enum(['short', 'detailed', 'career-channel'])).optional(),
    section: z.enum(['main', 'production', 'complementary', 'early']).optional(),
    tags: z.array(z.string()).optional(),
    secondaryTags: z.array(z.string()).optional(),
    environment: z
      .object({
        languages: z.array(z.string()).optional(),
        tools: z.array(z.string()).optional(),
        systems: z.array(z.string()).optional(),
        methods: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

const cvSections = defineCollection({
  loader: CV_BASE
    ? glob({ pattern: '{fr,en}/*.md', base: CV_BASE })
    : githubLoader({
        repo: CARBON_NOTES,
        pathPattern: 'cv/{fr,en}/*.md',
        token: CONTENT_TOKEN,
        stripPrefix: 'cv/',
      }),
  schema: z.object({
    schemaVersion: z.number().optional(),
    type: z.enum(['profile', 'domains', 'skills', 'education', 'projects', 'extra-info', 'interests', 'summary']),
    priority: z.number().optional(),
    // profile
    name: z.string().optional(),
    title: z.string().optional(),
    baseline: z.string().optional(),
    image: z.string().optional(),
    location: z.string().optional(),
    contact: z.object({ email: z.string(), phone: z.string().optional(), github: z.string().optional(), linkedin: z.string().optional() }).optional(),
    positioning: z.array(z.string()).optional(),
    variants: z
      .object({
        default: z.enum(['short', 'detailed']).optional(),
        available: z.array(z.enum(['short', 'detailed'])).optional(),
      })
      .optional(),
    pdf: z
      .object({
        short: z.object({ filename: z.string(), pageTarget: z.number().optional() }).optional(),
        detailed: z.object({ filename: z.string(), pageTarget: z.number().optional() }).optional(),
      })
      .optional(),
    // skills
    skills: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  }),
});

const HOMELAB = 'Trophalaxeur/gallium-homelab';
const NEON = 'Trophalaxeur/neon-agents';

const docs = defineCollection({
  loader: githubLoader([
    {
      local: true,
      base: 'docs',
      pathPattern: '**/*.md',
      idPrefix: 'bismuth/',
      stripExtension: true,
      starlightDocsBase: 'src/content/docs',
    },
    {
      repo: HOMELAB,
      pathPattern: 'docs/**/*.md',
      token: CONTENT_TOKEN,
      stripPrefix: 'docs/',
      idPrefix: 'homelab/',
      stripExtension: true,
      starlightDocsBase: 'src/content/docs',
    },
    {
      repo: NEON,
      pathPattern: 'docs/**/*.md',
      token: CONTENT_TOKEN,
      stripPrefix: 'docs/',
      idPrefix: 'neon/',
      stripExtension: true,
      starlightDocsBase: 'src/content/docs',
    },
    {
      repo: CARBON_NOTES,
      pathPattern: 'docs/**/*.md',
      token: CONTENT_TOKEN,
      stripPrefix: 'docs/',
      idPrefix: 'carbon-notes/',
      stripExtension: true,
      starlightDocsBase: 'src/content/docs',
    },
  ]),
  schema: docsSchema(),
});

export const collections = { postFr, postEn, cvExperiences, cvSections, docs };
