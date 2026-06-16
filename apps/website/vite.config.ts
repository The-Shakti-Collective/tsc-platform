import { resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import { ROUTES } from './routes.config.mjs';

function htmlPartialsPlugin() {
  const partialsDir = resolve(__dirname, 'src/partials');
  const partialNames = readdirSync(partialsDir).filter((f) => f.endsWith('.html'));

  return {
    name: 'tsc-html-partials',
    transformIndexHtml(html: string) {
      let out = html;
      for (const file of partialNames) {
        const name = file.replace(/\.html$/, '');
        const partial = readFileSync(resolve(partialsDir, file), 'utf8');
        out = out.replaceAll(`<!-- partial:${name} -->`, partial);
      }
      return out;
    },
  };
}

const input = Object.fromEntries(
  Object.entries(ROUTES).map(([key, file]) => [key, resolve(__dirname, file)]),
);

export default defineConfig({
  root: __dirname,
  publicDir: 'public',
  plugins: [htmlPartialsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input },
  },
  server: {
    port: 3002,
  },
});
