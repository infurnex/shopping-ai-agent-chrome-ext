import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main extension files
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        
        // Content script
        content: resolve(__dirname, 'src/content/content.ts'),
        
        // Injected frame application
        frame: resolve(__dirname, 'src/app/index.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'content.js';
          }
          if (chunkInfo.name === 'frame') {
            return 'frame.js';
          }
          return '[name]/index.js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (/\.css$/i.test(assetInfo.name || '')) {
            if (assetInfo.name === 'index.css' && assetInfo.source?.toString().includes('frame-root')) {
              return 'frame.css';
            }
            return '[name]/style.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});