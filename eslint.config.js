import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import rxjsPlugin from 'eslint-plugin-rxjs-x';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/', '.astro/', '**/*.md', '**/*.mdx'] },

  // Base rules — all files
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  stylistic.configs.recommended,

  // Astro recommended — must come before React rules
  ...astroPlugin.configs['flat/recommended'],
  jsxA11y.flatConfigs.recommended,

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
