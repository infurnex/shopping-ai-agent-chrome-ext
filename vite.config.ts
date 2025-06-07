import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
          // Generate clean file names for extension files
          const name = chunkInfo.name;
          if (name === 'content') return 'content.js';
          if (name === 'frame') return 'frame.js';
          if (name === 'popup') return 'popup/popup.js';
          if (name === 'options') return 'options/options.js';
          return '[name].js';
        },
        chunkFileNames: (chunkInfo) => {
          // Prevent unnecessary chunk files
          return 'chunks/[name].js';
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          
          // Handle CSS files
          if (name.endsWith('.css')) {
            if (name.includes('index') && assetInfo.source?.toString().includes('frame-root')) {
              return 'frame.css';
            }
            if (name.includes('popup')) return 'popup/popup.css';
            if (name.includes('options')) return 'options/options.css';
            return '[name].css';
          }
          
          // Handle other assets
          return 'assets/[name][extname]';
        },
      },
      external: [
        // Exclude any unnecessary dependencies
      ],
    },
    // Minimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});