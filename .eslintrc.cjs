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
    '@typescript-eslint/semi': 'warn',
    '@typescript-eslint/member-delimiter-style': 'warn',
    '@typescript-eslint/no-explicit-any': 'off'
  }
}
