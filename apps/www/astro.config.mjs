// @ts-check

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'Montserrat',
        cssVariable: '--font-sans',
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  site: 'https://orangecloud.app',
});
