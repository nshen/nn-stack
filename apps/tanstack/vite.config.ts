import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import alchemy from 'alchemy/cloudflare/tanstack-start';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    EnvironmentPlugin('all', {
      prefix: 'NEXT_PUBLIC_',
      defineOn: 'import.meta.env',
    }),
    alchemy(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
});
