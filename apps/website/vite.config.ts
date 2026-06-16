import { resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import type { Connect } from 'vite';
import { defineConfig } from 'vite';
import { REDIRECTS, ROUTES } from './routes.config.mjs';

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

/** Map ROUTES entry file → clean URL path (e.g. artists/index.html → /artists). */
function fileToRoutePath(file: string): string {
  if (file === 'index.html') return '/';
  return `/${file.replace(/\/index\.html$/, '')}`;
}

const MPA_ROUTE_ENTRIES = Object.values(ROUTES)
  .map((file) => ({ file, path: fileToRoutePath(file) }))
  .sort((a, b) => b.path.length - a.path.length);

/** Clean URLs served from public/ (not Vite HTML entries). */
const PUBLIC_STATIC_PAGES: Record<string, string> = {
  '/harshadduhita': '/harshadduhita/index.html',
};

function shouldBypassMpaFallback(pathname: string): boolean {
  if (pathname.startsWith('/@') || pathname.startsWith('/__vite')) return true;
  if (pathname.startsWith('/node_modules/')) return true;
  if (pathname.startsWith('/src/')) return true;
  // Static assets (has extension) except explicit .html requests
  if (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith('.html')) return true;
  return false;
}

function mpaDevFallback(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const rawUrl = req.url ?? '/';
    const qIndex = rawUrl.indexOf('?');
    const pathname = qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex);
    const search = qIndex === -1 ? '' : rawUrl.slice(qIndex);

    if (shouldBypassMpaFallback(pathname)) {
      next();
      return;
    }

    const normalized =
      pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    for (const redirect of REDIRECTS) {
      if (normalized === redirect.source) {
        res.statusCode = redirect.permanent ? 301 : 307;
        res.setHeader('Location', redirect.destination);
        res.end();
        return;
      }
    }

    const publicPage = PUBLIC_STATIC_PAGES[normalized];
    if (publicPage) {
      req.url = `${publicPage}${search}`;
      next();
      return;
    }

    for (const { file, path } of MPA_ROUTE_ENTRIES) {
      if (normalized === path) {
        req.url = `/${file}${search}`;
        next();
        return;
      }
    }

    next();
  };
}

function mpaDevPlugin() {
  return {
    name: 'tsc-mpa-dev-fallback',
    configureServer(server: { middlewares: Connect.Server }) {
      // Run before Vite's html fallback so /artists → artists/index.html
      server.middlewares.use(mpaDevFallback());
    },
    configurePreviewServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use(mpaDevFallback());
    },
  };
}

const input = Object.fromEntries(
  Object.entries(ROUTES).map(([key, file]) => [key, resolve(__dirname, file)]),
);

export default defineConfig({
  root: __dirname,
  publicDir: 'public',
  appType: 'mpa',
  plugins: [htmlPartialsPlugin(), mpaDevPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input },
  },
  server: {
    port: 3002,
  },
});
