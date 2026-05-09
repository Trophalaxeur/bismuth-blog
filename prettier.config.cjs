/** @type {import("prettier").Config} */
module.exports = {
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-astro',
    'prettier-plugin-tailwindcss',
  ],
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 180,
  trailingComma: 'es5',
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: { parser: 'typescript' },
    },
  ],
}
