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

export async function renderMarkdown(md: string): Promise<string> {
  const result = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).process(md);
  return String(result);
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
