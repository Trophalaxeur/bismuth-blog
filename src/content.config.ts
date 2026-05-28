import { glob } from 'astro/loaders';
import { z } from 'zod';
import { defineCollection } from 'astro:content';

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

const post = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/post' }),
  schema: ({ image }) =>
    z.object({
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
          src: image(),
          alt: z.string(),
        })
        .optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      ogImage: z.string().optional(),
    }),
});

const cvExperiences = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cv/experiences' }),
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
    variants: z.array(z.string()).optional(),
    section: z.string().optional(),
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
  loader: glob({ pattern: '*.md', base: './src/content/cv' }),
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
    // skills
    skills: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  }),
});

export const collections = { post, cvExperiences, cvSections };
