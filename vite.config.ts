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
          return chunkInfo.name === 'content' 
            ? 'content.js' 
            : chunkInfo.name === 'frame'
              ? 'frame.js'
              : '[name]/[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name][extname]';
          }
          
          if (/\.css$/i.test(assetInfo.name)) {
            return assetInfo.name === 'frame.css' 
              ? 'frame.css' 
              : '[name]/[name][extname]';
          }
          
          return 'assets/[name][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});