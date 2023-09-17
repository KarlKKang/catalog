module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  overrides: [],
  rules: {
    'quotes': ['error', 'single'],
    'semi': 'off',
    'prefer-arrow-callback': 'error',
    'arrow-parens': ['error', 'always'],
    'arrow-body-style': ['error', 'as-needed'],
    'func-style': ['error', 'declaration', { 'allowArrowFunctions': true }],
    'class-methods-use-this': 'error',
    '@typescript-eslint/semi': 'error',
    '@typescript-eslint/member-delimiter-style': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
  }
};
