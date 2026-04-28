import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import alchemy from 'alchemy/cloudflare/tanstack-start';

export default defineConfig({
  server: {
    port: 3000,
  },
  envPrefix: 'NEXT_PUBLIC_',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    alchemy(),
    tanstackStart({ target: 'cloudflare-module', customViteReactPlugin: true }),
    viteReact(),
    tailwindcss(),
  ],
});
