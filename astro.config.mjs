import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import rehypeExternalLinks from 'rehype-external-links'
import expressiveCode from 'astro-expressive-code'
import { expressiveCodeOptions } from './src/site.config'
import icon from 'astro-icon'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
	site: 'https://flefevre.fr',
	integrations: [
		expressiveCode(expressiveCodeOptions),
		sitemap(),
		mdx(),
		icon()
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
					rel: ['nofollow, noopener, noreferrer']
				}
			]
		],
		remarkRehype: {
			footnoteLabelProperties: {
				className: ['']
			}
		}
	},
	prefetch: true,
	output: 'static'
})
