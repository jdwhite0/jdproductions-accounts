import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Default to root "/" so assets resolve correctly when VITE_APP_BASE_URL is unset
  // (an unset value previously became the string "undefined", breaking all asset paths → white screen)
  const APP_BASE_URL = env.VITE_APP_BASE_URL && env.VITE_APP_BASE_URL !== 'undefined' ? env.VITE_APP_BASE_URL : '/';

  return {
    server: {
      port: 5173,
      host: true
    },
    preview: {
      host: true
    },
    define: {
      global: 'window'
    },
    base: APP_BASE_URL,
    plugins: [react(), jsconfigPaths()],
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        // Dual HTML entries so invest. hosts get Early Support OG meta in static HTML
        // (crawlers do not run the SPA). Same React entry for both.
        input: {
          main: path.resolve(__dirname, 'index.html'),
          invest: path.resolve(__dirname, 'invest.html'),
        },
        output: {
          manualChunks: {
            mui: ['@mui/material', '@mui/x-charts'],
            react: ['react', 'react-dom'],
            vendor: ['lodash-es', 'swr', 'react-router-dom'],
          }
        }
      }
    }
  };
});
