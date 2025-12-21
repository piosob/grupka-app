// @ts-check
import { defineConfig, envField } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    integrations: [react()],

    vite: {
        plugins: [tailwindcss()],
    },
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    // Konfiguracja zmiennych
    env: {
        schema: {
            // Definiujemy, że te zmienne są wymagane i są typu string
            // context: 'server' oznacza, że te zmienne są ukryte przed przeglądarką!
            SUPABASE_URL: envField.string({ context: 'server', access: 'public' }),
            SUPABASE_KEY: envField.string({ context: 'server', access: 'secret' }),
        },
    },
});
