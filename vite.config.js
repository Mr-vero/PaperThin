import path from 'path';
import framework7 from 'rollup-plugin-framework7';
import { defineConfig } from 'vite';


const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www',);
export default defineConfig({
  plugins: [
    framework7({ emitCss: false }),
  ],
  root: SRC_DIR,
  base: '',
  publicDir: PUBLIC_DIR,
  build: {
    outDir: BUILD_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      treeshake: false,
      input: {
        main: 'index.html',
        'service-worker': 'public/service-worker.js'
      }
    }
  },
  resolve: {
    alias: {
      '@': SRC_DIR,
    },
  },
  server: {
    host: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  esbuild: {
    jsxFactory: '$jsx',
    jsxFragment: '"Fragment"',
  },
});
