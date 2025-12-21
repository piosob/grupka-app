import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
    // 1. Konfiguracja dla wszystkich plików (Globalne ignorowanie)
    {
        ignores: ['dist', 'node_modules', '.astro', '.env'],
    },

    // 2. Konfiguracja dla plików ASTRO
    ...eslintPluginAstro.configs.recommended,
    {
        files: ['**/*.astro'],
        rules: {
            // Tutaj możesz nadpisać reguły specyficzne dla Astro
            // np. "astro/no-set-html-directive": "error"
        },
    },

    // 3. Konfiguracja dla plików TypeScript i React (.ts, .tsx)
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        settings: {
            react: {
                version: 'detect', // Automatycznie wykryj wersję Reacta
            },
        },
        rules: {
            // Importujemy rekomendowane reguły ręcznie w Flat Config (lub używamy spread syntax jeśli configi są kompatybilne)
            ...tseslint.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,

            // React 17+ nie wymaga importu Reacta w JSX
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off', // Używamy TS, więc prop-types są zbędne
        },
    },
];
