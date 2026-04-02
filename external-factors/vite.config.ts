import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const STANDALONE_ASSET_LIMIT_BYTES = 100_000_000;

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';

  return {
    base: './',
    define: { global: 'globalThis' },
    plugins: [react(), tailwindcss()],
    build: standalone
      ? {
          assetsInlineLimit: STANDALONE_ASSET_LIMIT_BYTES,
          cssCodeSplit: false,
          rolldownOptions: {
            output: {
              codeSplitting: false,
            },
          },
        }
      : undefined,
  };
});
