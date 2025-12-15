export default [
  {
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/*.ts', '**/*.tsx'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    rules: {},
  },
];
