import eslintPluginAstro from 'eslint-plugin-astro'
import tsParser from '@typescript-eslint/parser'

export default [
	...eslintPluginAstro.configs.recommended,
	{
		files: ['**/*.{js,ts,jsx,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 'latest'
			}
		}
	},
	{
		files: ['**/*.astro'],
		languageOptions: {
			parser: (await import('astro-eslint-parser')).default,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.astro']
			}
		}
	}
]
