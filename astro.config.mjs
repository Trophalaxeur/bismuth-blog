import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
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
		starlight({
			title: 'Docs — flefevre.fr',
			customCss: ['./src/styles/starlight.css'],
			components: {
				// Docs are intentionally EN-only — the "not yet translated" banner is misleading
				FallbackContentNotice: './src/components/starlight/EmptyFallbackNotice.astro',
				Header: './src/components/starlight/SiteHeader.astro',
			},
			sidebar: [
					{ label: 'Overview', link: '/docs/' },
				{ label: 'Bismuth', items: [{ autogenerate: { directory: 'bismuth' } }] },
				{ label: 'Carbon Notes', items: [{ autogenerate: { directory: 'carbon-notes' } }] },
				{ label: 'Homelab', items: [{ autogenerate: { directory: 'homelab' } }] },
				{ label: 'Neon', items: [{ autogenerate: { directory: 'neon' } }] },
			],
		}),
		expressiveCode(expressiveCodeOptions),
		sitemap({ filter: (page) => !page.includes('/print') }),
		mdx(),
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
		fallback: { en: 'fr' },
		routing: {
			prefixDefaultLocale: false,
			fallbackType: 'rewrite',
		},
	},
	prefetch: true,
	output: 'static'
})
