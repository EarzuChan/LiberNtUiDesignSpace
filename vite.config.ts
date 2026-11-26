import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react({ jsxImportSource: '@/i18n' })],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  server: { port: 5173, strictPort: true },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        desktop: resolve(import.meta.dirname, 'index.html'),
        spec: resolve(import.meta.dirname, 'spec.html'),
        ...Object.fromEntries(['loginui', 'boot', 'bootmenu', 'bugcheck', 'recovery'].map(p => [p, resolve(import.meta.dirname, `${p}.html`)])),
      },
    },
  },
});
