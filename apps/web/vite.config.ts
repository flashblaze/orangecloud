import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
    }),
    devtoolsJson({ uuid: '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b' }), // https://stackoverflow.com/questions/79629915/well-known-appspecific-com-chrome-devtools-json-request
  ],
});
