import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'zod';
import { githubLoader } from './loaders/github-loader.mjs';

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

const CONTENT_TOKEN = import.meta.env.CONTENT_TOKEN as string;
const CARBON_NOTES = 'Trophalaxeur/carbon-notes';

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
    pathPattern: 'articles/**/fr/index.{md,mdx}',
    token: CONTENT_TOKEN,
  }),
  schema: postSchema,
});

const postEn = defineCollection({
  loader: githubLoader({
    repo: CARBON_NOTES,
    pathPattern: 'articles/**/en/index.{md,mdx}',
    token: CONTENT_TOKEN,
  }),
  schema: postSchema,
});

const cvExperiences = defineCollection({
  loader: githubLoader({
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
  loader: githubLoader({
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

const HOMELAB = 'Trophalaxeur/homelab-gallium';
const NEON = 'Trophalaxeur/neon-agents';

const docs = defineCollection({
  loader: githubLoader([
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
