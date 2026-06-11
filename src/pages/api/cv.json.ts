import { getCollection } from 'astro:content';
import { extractVariantMarkdown, parseDomains, sortCvExperiences, stripMarkdownForCareerChannel } from '@/utils';

export async function GET() {
  const locale = 'fr';

  const [sections, experiences] = await Promise.all([
    getCollection('cvSections'),
    getCollection('cvExperiences'),
  ]);

  const frSections = sections.filter((e) => e.id.startsWith(`${locale}/`));
  const frExperiencesRaw = experiences.filter(
    (e) => e.id.startsWith(`${locale}/`) && e.data.section !== 'early'
  );

  const frExperiences = sortCvExperiences(frExperiencesRaw);

  const profile = frSections.find((e) => e.data.type === 'profile');
  const skillsEntry = frSections.find((e) => e.data.type === 'skills');
  const summaryEntry = frSections.find((e) => e.data.type === 'summary');
  const educationEntry = frSections.find((e) => e.data.type === 'education');
  const domainsEntry = frSections.find((e) => e.data.type === 'domains');
  const projectsEntry = frSections.find((e) => e.data.type === 'projects');

  const rawSkills = skillsEntry?.data.skills ?? {};
  const skills: Record<string, string[]> = Object.fromEntries(
    Object.entries(rawSkills).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
  );

  // Comprehensive technology list: every tool/language/method used across ALL
  // experiences (early included) + the curated skills, de-duplicated. Gives the
  // AI the full breadth of real skills to match against large form taxonomies.
  const allExperiences = experiences.filter((e) => e.id.startsWith(`${locale}/`));
  const technologies = [
    ...new Set(
      [
        ...Object.values(skills).flat(),
        ...allExperiences.flatMap((e) => [
          ...(e.data.environment?.languages ?? []),
          ...(e.data.environment?.tools ?? []),
          ...(e.data.environment?.systems ?? []),
          ...(e.data.environment?.methods ?? []),
        ]),
        ...allExperiences.flatMap((e) => e.data.secondaryTags ?? []),
      ].map((s) => s.replace(/\*\*/g, '').trim())
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale));

  const cv = {
    meta: {
      name: profile?.data.name ?? '',
      title: profile?.data.title ?? '',
      baseline: profile?.data.baseline ?? '',
      location: profile?.data.location ?? '',
      email: profile?.data.contact?.email ?? '',
      github: profile?.data.contact?.github ?? '',
      linkedin: profile?.data.contact?.linkedin ?? '',
      positioning: profile?.data.positioning ?? [],
    },
    summary: summaryEntry?.body
      ? stripMarkdownForCareerChannel(extractVariantMarkdown(summaryEntry.body, 'detailed'))
      : '',
    domains: parseDomains(extractVariantMarkdown(domainsEntry?.body ?? '', 'detailed')).map((d) => `${d.title} — ${d.description}`),
    skills,
    technologies,
    experiences: frExperiences.map((exp) => {
      const body = exp.body ?? '';
      const hasDetailed = exp.data.variants?.includes('detailed');
      const variant = hasDetailed ? 'detailed' : 'short';
      const md = extractVariantMarkdown(body, variant);
      return {
        role: exp.data.role,
        company: exp.data.company,
        employer: exp.data.employer,
        start: exp.data.start,
        end: exp.data.end,
        tags: exp.data.tags ?? [],
        secondaryTags: exp.data.secondaryTags ?? [],
        stack: [
          ...(exp.data.environment?.languages ?? []),
          ...(exp.data.environment?.tools ?? []),
        ],
        methods: exp.data.environment?.methods ?? [],
        description: stripMarkdownForCareerChannel(md),
      };
    }),
    education: educationEntry?.body
      ? stripMarkdownForCareerChannel(extractVariantMarkdown(educationEntry.body, 'detailed'))
      : '',
    projects: projectsEntry?.body
      ? stripMarkdownForCareerChannel(extractVariantMarkdown(projectsEntry.body, 'detailed'))
      : '',
  };

  return new Response(JSON.stringify(cv), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
