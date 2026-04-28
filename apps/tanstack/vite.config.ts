import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import alchemy from 'alchemy/cloudflare/tanstack-start';

// Bridge NEXT_PUBLIC_* from process.env (populated by `alchemy --env-file`)
// into import.meta.env at build time. Vite's envPrefix only loads from
// .env* files; our stage env files (.local.env / .dev.env / .prod.env)
// are read by alchemy, not vite.
const publicEnvDefine = Object.fromEntries(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith('NEXT_PUBLIC_'))
    .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v ?? '')]),
);

export default defineConfig({
  server: {
    port: 3000,
  },
  envPrefix: 'NEXT_PUBLIC_',
  resolve: {
    tsconfigPaths: true,
  },
  define: publicEnvDefine,
  plugins: [alchemy(), tanstackStart(), viteReact(), tailwindcss()],
});
