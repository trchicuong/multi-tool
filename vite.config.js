import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Target modern browsers — enables better tree-shaking & smaller output
    target: 'es2020',
    // Skip gzip size calculation during build (faster CI/CD)
    reportCompressedSize: false,
    // @faker-js/faker is intentionally large (~2.4 MB) and isolated in its own
    // chunk — only fetched when the user opens the Fake Data tool.
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: 'index.html',
      output: {
        /**
         * Isolate heavy vendor deps into named chunks so they are cached
         * independently from tool chunks and don't bloat the main bundle.
         *
         * @faker-js/faker  ≈ 2 MB  — only used by fakeData.js
         * diff             ≈ 50 KB — only used by diffChecker.js
         * papaparse        ≈ 80 KB — only used by csvJson.js
         * qrcode           ≈ 60 KB — only used by qrGenerator.js
         */
        manualChunks(id) {
          if (id.includes('node_modules/@faker-js')) return 'vendor-faker';
          if (id.includes('node_modules/diff')) return 'vendor-diff';
          if (id.includes('node_modules/papaparse')) return 'vendor-papaparse';
          if (id.includes('node_modules/qrcode')) return 'vendor-qrcode';
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
