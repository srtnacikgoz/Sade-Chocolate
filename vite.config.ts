import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // React ve react-router ayrı chunk
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              // Firebase ayrı chunk (en büyük kütüphane)
              'firebase': [
                'firebase/app',
                'firebase/auth',
                'firebase/firestore',
                'firebase/storage'
              ],
              // UI kütüphaneleri
              'ui-vendor': ['sonner', 'lucide-react'],
              // Zustand ve diğer state management
              'state-vendor': ['zustand']
            }
          }
        },
        chunkSizeWarningLimit: 600,
        sourcemap: false
      }
    };
});
