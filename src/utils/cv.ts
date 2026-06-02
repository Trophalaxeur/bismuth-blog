import { getCollection } from 'astro:content';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export type CvVariant = 'short' | 'detailed' | 'career-channel';

export function extractVariantMarkdown(markdown: string, variant: CvVariant): string {
  let result = markdown;
  // Remove all variant blocks that are NOT the target
  result = result.replace(new RegExp(`:::(?!${variant}\\b)\\w+[\\s\\S]*?:::`, 'g'), '');
  // Unwrap the target variant
  result = result.replace(new RegExp(`:::${variant}([\\s\\S]*?):::`, 'g'), '$1');
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strips Markdown syntax from a string, producing plain text suitable for career channel
 * platforms (e.g. LinkedIn) that do not render Markdown in experience descriptions.
 * - **bold** / __bold__ → bold
 * - *italic* / _italic_ → italic
 * - "- item" / "* item" at line start → "• item"
 * - # headings → plain text
 * - [text](url) → text
 */
export function stripMarkdownForCareerChannel(markdown: string): string {
  let text = markdown;
  // Strip bold
  text = text.replace(/\*\*(.+?)\*\*/gs, '$1');
  text = text.replace(/__(.+?)__/gs, '$1');
  // Strip italic (careful not to strip underscores mid-word)
  text = text.replace(/\*(.+?)\*/gs, '$1');
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/gs, '$1');
  // Convert bullet list markers to Unicode bullet
  text = text.replace(/^[*-] /gm, '• ');
  // Strip ATX headings
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Strip inline links, keep the label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Vocabulary of technical terms and structuring concepts to automatically colorize
 * as `<span class="cv-tech">` (semi-bold blue) across the whole CV rendering.
 *
 * Rule: "Semi-bold blue = technology or central tool" (CV visual grammar).
 * Order: longest phrases first to avoid partial matches.
 *
 * To add a term: insert it while preserving descending length order.
 */
const TECH_TERMS: string[] = [
  // Long concepts/phrases
  'Architecture applicative',
  'Qualité & delivery',
  'API Integration',
  'TypeScript strict',
  'GitLab CI/CD',
  'PHP/Symfony',
  'GitHub Copilot',
  'Claude Code',
  'Agents IA',
  'Angular Material',
  'Bitbucket vers GitHub',
  // Standalone tech terms (curation: keep profile-shaping technologies,
  // not common tools or historical technologies).
  'AngularJS',
  'NestJS',
  'NgRx',
  'RxJS',
  'TypeScript',
  'Angular',
  'ESLint',
  'Cypress',
  'Playwright',
  'Swagger',
  'OpenAPI',
  'GitHub',
  'Bitbucket',
  'CI/CD',
  'AWS',
  'Nx',
  'Symfony',
  'Spring',
  'Node.js',
  'Vue.js',
  'PostgreSQL',
  'PowerBuilder',
  'Odoo',
  'DevExtreme',
  'Firebase',
  'Smarty',
  'PHP',
  'Python',
  'Java',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const sortedTechTerms = [...TECH_TERMS].sort((a, b) => b.length - a.length);
const techRegex = new RegExp(`(?<![a-zA-Z0-9_-])(${sortedTechTerms.map(escapeRegex).join('|')})(?![a-zA-Z0-9_-])`, 'g');

/**
 * Wraps known technical terms in `<span class="cv-tech">` so they render
 * in semi-bold blue. Does not touch HTML tag contents (attributes).
 *
 * Limitation: uses regex on HTML, not a real DOM parser (acceptable for the
 * trusted, author-controlled markdown rendered here).
 */
export function colorizeTechTerms(html: string): string {
  // Split into alternating HTML tag / text segments. Apply the regex only to text segments.
  return html.replace(/(<[^>]+>)|([^<]+)/g, (_match, tag: string | undefined, text: string | undefined) => {
    if (tag) return tag;
    return (text ?? '').replace(techRegex, '<span class="cv-tech">$1</span>');
  });
}

export function colorizePlainTechTerms(text: string): string {
  let out = '';
  let lastIndex = 0;

  for (const match of text.matchAll(techRegex)) {
    const index = match.index ?? 0;
    const term = match[0];
    out += escapeHtml(text.slice(lastIndex, index));
    out += `<span class="cv-tech">${escapeHtml(term)}</span>`;
    lastIndex = index + term.length;
  }

  return out + escapeHtml(text.slice(lastIndex));
}

export async function renderMarkdown(md: string): Promise<string> {
  const result = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).process(md);
  return colorizeTechTerms(String(result));
}

/** Max characters for a career channel experience description (e.g. LinkedIn limit). */
export const CAREER_CHANNEL_MAX_CHARS = 2000;

function formatCvDate(yyyyMM: string): string {
  if (!yyyyMM.includes('-')) {
    return yyyyMM; // Year-only format: display as-is
  }
  const [year, month] = yyyyMM.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

/**
 * Formats a CV experience period.
 * - With end: "mmm. yyyy — mmm. yyyy"
 * - Ongoing:  "mmm. yyyy — Aujourd'hui"
 * - No end:   "mmm. yyyy" (no trailing separator)
 */
export function formatCvPeriod(start: string, end?: string, current?: boolean): string {
  const startLabel = formatCvDate(start);
  const endLabel = current ? "Aujourd'hui" : end ? formatCvDate(end) : '';
  if (!endLabel || endLabel === startLabel) return startLabel;
  return `${startLabel} — ${endLabel}`;
}

/** Sorts CV experiences by priority (ascending) then start date (descending). */
export function sortCvExperiences<T extends { data: { priority?: number; start: string } }>(experiences: T[]): T[] {
  return [...experiences].sort((a, b) => {
    const pDiff = (a.data.priority ?? 50) - (b.data.priority ?? 50);
    return pDiff !== 0 ? pDiff : b.data.start.localeCompare(a.data.start);
  });
}

export interface CvDomain {
  title: string;
  description: string;
  icon: string;
}

const DOMAIN_ICON_MAP: Array<{ test: RegExp; icon: string }> = [
  { test: /conception/i, icon: 'compass' },
  { test: /modernisation/i, icon: 'arrow-up-circle' },
  { test: /architecture/i, icon: 'layers' },
  { test: /qualit[eé]/i, icon: 'shield-check' },
  { test: /leadership/i, icon: 'users' },
  { test: /delivery/i, icon: 'target' },
  { test: /management/i, icon: 'briefcase' },
  { test: /product/i, icon: 'target' },
];

function getDomainIcon(title: string): string {
  for (const { test, icon } of DOMAIN_ICON_MAP) if (test.test(title)) return icon;
  return 'circle';
}

/**
 * Parses a markdown bullet list of domains into structured items.
 * Expected line format: `- **Title** — Description.`
 */
export function parseDomains(markdown: string): CvDomain[] {
  const items: CvDomain[] = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+?)\s*$/);
    if (match) {
      const title = match[1].trim();
      items.push({ title, description: match[2].trim(), icon: getDomainIcon(title) });
    }
  }
  return items;
}

export interface CvEnvironment {
  languages?: string[];
  tools?: string[];
  systems?: string[];
  methods?: string[];
}

/** Flattens an experience's environment object into a single comma-separated string.
 *  `methods` (Agile, V-cycle…) are intentionally excluded: environment = technical stack,
 *  not working methods (which appear in skills or bullets).
 *  No limit: display everything (curation happens in frontmatter).
 */
export function flattenEnvironment(env?: CvEnvironment): string {
  if (!env) return '';
  return [...(env.languages ?? []), ...(env.tools ?? []), ...(env.systems ?? [])].join(', ');
}

/**
 * Splits an annotated experience HTML into 3 parts so the card can interleave its own
 * blocks (e.g. the key skills line) between intro, impact and body.
 */
export function splitExperienceHtmlByParts(html: string): { intro: string; impact: string; body: string } {
  // 1. Impact line if present
  const impactMatch = html.match(/<p class="cv-impact"[\s\S]*?<\/p>/);
  if (impactMatch) {
    const impactStart = html.indexOf(impactMatch[0]);
    const impactEnd = impactStart + impactMatch[0].length;
    return {
      intro: html.slice(0, impactStart).trim(),
      impact: impactMatch[0],
      body: html.slice(impactEnd).trim(),
    };
  }
  // 2. Environment line — places everything before it as intro
  const envIdx = html.indexOf('<p class="cv-environment"');
  if (envIdx !== -1) {
    return { intro: html.slice(0, envIdx).trim(), impact: '', body: html.slice(envIdx).trim() };
  }
  // 3. Fallback: place the skills line right after intro paragraphs but BEFORE
  //    the first detailed content (sub-section header or bullet list). Required for
  //    short experiences (without impact or environment).
  const detailStart = html.search(/<p class="cv-subsection"|<ul/);
  if (detailStart !== -1) {
    return { intro: html.slice(0, detailStart).trim(), impact: '', body: html.slice(detailStart).trim() };
  }
  return { intro: html, impact: '', body: '' };
}

/**
 * Post-processes the rendered HTML of an experience description:
 * - Marks the "**Impact :**" paragraph with a `cv-impact` class so it can be visually emphasized.
 * - Inserts a discreet "Environnement : ..." italic line right after the impact paragraph
 *   (or, if there's no impact, before the first sub-section header).
 */
export function annotateExperienceHtml(html: string, envString: string): string {
  let out = html.replace(/<p>(<strong>Impact\s*:?\s*<\/strong>)/g, '<p class="cv-impact">$1');

  // Sub-section headers: paragraphs whose content is ONLY `<strong>X</strong>`.
  // CSS `:only-child` is not enough because it ignores surrounding text nodes.
  // Mark these paragraphs with `cv-subsection` so they inherit the blue-rule style.
  out = out.replace(/<p>(<strong>[\s\S]*?<\/strong>)<\/p>/g, (match, inner) => {
    // Exclude already-processed cv-impact paragraphs (they have text after the strong tag).
    if (match.includes('class="cv-impact"')) return match;
    return `<p class="cv-subsection">${inner}</p>`;
  });

  if (envString) {
    // No tech colorization here: the environment line is intentionally discreet metadata
    // (see visual hierarchy). Only escape to stay XSS-safe.
    const envHtml = `<p class="cv-environment"><em>Environnement : ${escapeHtml(envString)}</em></p>`;

    if (out.includes('class="cv-impact"')) {
      out = out.replace(/(<p class="cv-impact">[\s\S]*?<\/p>)/, `$1${envHtml}`);
    } else {
      const detailStart = out.search(/<p class="cv-subsection"|<ul/);
      out = detailStart === -1 ? `${out}${envHtml}` : `${out.slice(0, detailStart)}${envHtml}${out.slice(detailStart)}`;
    }
  }

  return out;
}

/** Returns the mapped data array for all career-channel CV experiences, ready to pass to CvCareerChannelCard. */
export async function getCareerChannelExperiencesData() {
  const all = await getCollection('cvExperiences');
  return sortCvExperiences(all.filter((e) => e.data.variants?.includes('career-channel'))).map(
    (exp) => ({
      company: exp.data.company,
      role: exp.data.role,
      start: exp.data.start,
      end: exp.data.end,
      current: exp.data.current,
      tags: exp.data.tags,
      text: stripMarkdownForCareerChannel(extractVariantMarkdown(exp.body ?? '', 'career-channel')),
    }),
  );
}
