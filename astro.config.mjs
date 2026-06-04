import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import rehypeExternalLinks from 'rehype-external-links'
import expressiveCode from 'astro-expressive-code'
import { expressiveCodeOptions } from './src/site.config'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
	site: 'https://flefevre.fr',
	integrations: [
		expressiveCode(expressiveCodeOptions),
		sitemap({ filter: (page) => !page.includes('/print') }),
		mdx()
	],
	vite: {
		plugins: [tailwindcss()]
	},
	markdown: {
		remarkPlugins: [remarkReadingTime],
		rehypePlugins: [
			rehypeUnwrapImages,
			[
				rehypeExternalLinks,
				{
					target: '_blank',
					rel: ['nofollow', 'noopener', 'noreferrer']
				}
			]
		],
		remarkRehype: {
			footnoteLabelProperties: {
				className: ['']
			}
		}
	},
	i18n: {
		defaultLocale: 'fr',
		locales: ['fr', 'en'],
		routing: { prefixDefaultLocale: false },
	},
	prefetch: true,
	output: 'static'
})
