import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const monacoSource = fileURLToPath(
  new URL('../../node_modules/monaco-editor/min/vs', import.meta.url),
);
const monacoTarget = fileURLToPath(new URL('./public/monaco/vs', import.meta.url));

const monacoAssets = {
  name: 'dsa-arcade-monaco-assets',
  async configureServer() {
    await cp(monacoSource, monacoTarget, { recursive: true });
  },
  async buildStart() {
    await cp(monacoSource, monacoTarget, { recursive: true });
  },
};

// The dev server proxies /api to the Express API so the browser only ever talks
// to one origin — no CORS and the httpOnly refresh cookie stays first-party.
export default defineConfig({
  plugins: [react(), monacoAssets],
  resolve: {
    // Avoid Vite's realpath call on workspace HTML entries on Windows. In this
    // checkout it can fail with EPERM even though the file is readable.
    preserveSymlinks: true,
  },
  // This workspace package points directly at TypeScript source. Keeping it
  // out of Vite's dependency prebundle avoids stale exports after shared types
  // and data are added during development.
  optimizeDeps: {
    exclude: ['@dsa/shared', '@dsa/shared/greenhouse'],
  },
  server: {
    port: 5173,
    watch: {
      // Monaco's copied localization/worker assets are generated files, not app source.
      // Watching thousands of these files can fail with EBUSY on Windows.
      ignored: ['**/public/monaco/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
