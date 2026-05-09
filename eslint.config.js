import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import rxjsPlugin from 'eslint-plugin-rxjs-x';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/', '.astro/', '**/*.md', '**/*.mdx'] },

  // Base rules — all files
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  stylistic.configs.recommended,

  // Type-aware rules — TS/TSX only (requires tsconfig type info)
  {
    files: ['**/*.{ts,tsx}'],
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname, // Node 22+ native (added in Node 21.2) — not the old fileURLToPath workaround
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },

  // Astro recommended — must come before React rules
  ...astroPlugin.configs['flat/recommended'],
  jsxA11y.flatConfigs.recommended,

  // Astro: warn on set:html (XSS surface — fine for static content, watch for dynamic)
  // label-has-associated-control: jsx-a11y looks for JSX `htmlFor`, Astro uses HTML `for` — false positives
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-set-html-directive': 'warn',
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },

  // Unused imports — auto-fixable cleanup (replaces TS no-unused-vars for imports)
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
  },

  // React rules — JSX/TSX only (Astro files use class= not className=)
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactPlugin.configs.flat.recommended,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactHooks.configs.flat['recommended-latest'],
  },

  // RxJS rules — TS/JS only (requires type information)
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ...rxjsPlugin.configs.recommended,
    languageOptions: {
      ...rxjsPlugin.configs.recommended.languageOptions,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  { settings: { react: { version: '19.0.0' } } },

  // Astro boilerplate: /// <reference path="..." /> is required in env.d.ts
  {
    files: ['src/env.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },

  // Prettier must be last — disables formatting rules that conflict
  eslintConfigPrettier,
]);
