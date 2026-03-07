import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',   // <-- ADD THIS

  optimizeDeps: {
    include: ['yjs', 'y-websocket', '@lexical/yjs']
  },

  plugins: [react()],

  server: {
    host: '127.0.0.1',
    port: 5173,
    hmr: {
      clientPort: 5173
    }
  },

  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
