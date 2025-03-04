import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',  // <- Make sure Vite builds into "dist"
    emptyOutDir: false,  // <- Prevent Webpack-built files from being removed
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup/index.html'),  // Entry for the popup UI
        window: path.resolve(__dirname, 'popup/start.html'),  // New entry for the extra window

      }
    }
  }
});
