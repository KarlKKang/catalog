import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from "globals";

const config = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    stylistic.configs.customize({
        semi: true,
        arrowParens: true,
        indent: 4,
        braceStyle: '1tbs',
    }),
    {
        rules: {
            'eqeqeq': 'error',
            'prefer-arrow-callback': 'error',
            'arrow-body-style': ['error', 'as-needed'],
            'func-style': ['error', 'declaration', { 'allowArrowFunctions': true }],
            'class-methods-use-this': 'error',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            }
        },
    }
);

export default config;