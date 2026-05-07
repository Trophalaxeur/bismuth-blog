import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export function extractVariantMarkdown(markdown: string, variant: 'short' | 'detailed'): string {
	const other = variant === 'short' ? 'detailed' : 'short'
	let result = markdown
	result = result.replace(new RegExp(`:::${other}[\\s\\S]*?:::`, 'g'), '')
	result = result.replace(new RegExp(`:::${variant}([\\s\\S]*?):::`, 'g'), '$1')
	return result.replace(/\n{3,}/g, '\n\n').trim()
}

export async function renderMarkdown(md: string): Promise<string> {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(md)
	return String(result)
}
