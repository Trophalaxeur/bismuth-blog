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
 * Vocabulaire des termes techniques et concepts structurants à colorier
 * automatiquement en `<span class="cv-tech">` (bleu semi-bold) dans tout le rendu CV.
 *
 * Règle "Bleu semi-bold = technologie ou outil central" (grammaire visuelle CV).
 * Ordre : phrases longues d'abord pour éviter les matchs partiels.
 *
 * Pour ajouter un terme : insérer en respectant l'ordre décroissant de longueur.
 */
const TECH_TERMS: string[] = [
  // Concepts/phrases longues
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
  // Tech standalone (curation : on garde les techs structurantes du profil,
  // pas les outils courants ni les techs historiques)
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

const sortedTechTerms = [...TECH_TERMS].sort((a, b) => b.length - a.length);
const techRegex = new RegExp(
  `(?<![a-zA-Z0-9_-])(${sortedTechTerms.map(escapeRegex).join('|')})(?![a-zA-Z0-9_-])`,
  'g'
);

/**
 * Wrappe les termes techniques connus dans `<span class="cv-tech">` pour qu'ils soient
 * affichés en bleu semi-bold. Ne touche pas au contenu des tags HTML (attributs).
 *
 * Limitation : utilise des regex sur du HTML, pas un vrai parser DOM.
 * Cf. docs/next-steps.md.
 */
export function colorizeTechTerms(html: string): string {
  // On découpe en alternant tag HTML / texte. On n'applique le regex qu'aux segments texte.
  return html.replace(/(<[^>]+>)|([^<]+)/g, (_match, tag: string | undefined, text: string | undefined) => {
    if (tag) return tag;
    return (text ?? '').replace(techRegex, '<span class="cv-tech">$1</span>');
  });
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
 *  `methods` (Agile, Cycle en V…) are intentionally excluded: Environnement = stack technique,
 *  pas méthodes de travail (qui apparaissent dans les compétences ou les bullets).
 *  Aucune limite : on affiche tout (la curation se fait dans les frontmatters).
 */
export function flattenEnvironment(env?: CvEnvironment): string {
  if (!env) return '';
  return [...(env.languages ?? []), ...(env.tools ?? []), ...(env.systems ?? [])].join(', ');
}

/**
 * Splits an annotated experience HTML into 3 parts so the card can interleave its own
 * blocks (e.g. the Compétences clés line) between intro, impact and body.
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
  // 3. Fallback : place the Compétences line right after the intro paragraphs but BEFORE
  //    the first detailed content (sub-section header or bullet list). Indispensable pour
  //    les expériences courtes (sans impact ni environnement).
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

  // Sub-section headers : paragraphes dont le contenu est UNIQUEMENT un <strong>X</strong>
  // (CSS `:only-child` ne suffit pas car il ignore les nœuds texte autour).
  // On marque ces paragraphes avec `cv-subsection` pour qu'ils héritent du style filet-bleu.
  out = out.replace(/<p>(<strong>[\s\S]*?<\/strong>)<\/p>/g, (match, inner) => {
    // Exclure les cv-impact déjà traités (ils ont du texte après le strong).
    if (match.includes('class="cv-impact"')) return match;
    return `<p class="cv-subsection">${inner}</p>`;
  });

  if (envString) {
    const envHtml = `<p class="cv-environment"><em>Environnement : ${envString}</em></p>`;

    if (out.includes('class="cv-impact"')) {
      out = out.replace(/(<p class="cv-impact">[\s\S]*?<\/p>)/, `$1${envHtml}`);
    } else {
      const firstSubSection = out.match(/<p><strong>[^<]+<\/strong><\/p>/);
      if (firstSubSection) {
        out = out.replace(firstSubSection[0], `${envHtml}${firstSubSection[0]}`);
      }
    }
  }

  return out;
}
