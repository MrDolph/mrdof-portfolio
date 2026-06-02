import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  base: './',
  plugins: [
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'Fatai Dawodu | Portfolio',
          description: 'Professional Virtual Assistant Portfolio',
        },
      },
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 10240,
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
