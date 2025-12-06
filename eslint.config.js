import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['node_modules', 'build', 'dist', 'coverage', 'tests/**'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      semi: 'error',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-const-assign': 'error',
      curly: 'warn',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
