import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  optimizeDeps: {
    // rolldown optimizer가 react-hook-form을 사전 번들하면서 React 사본을
    // chunk에 인라인해 "Invalid hook call"이 발생한다. 둘 다 순수 ESM이라
    // 사전 번들 없이 그대로 서빙하면 단일 react chunk를 공유한다.
    exclude: ['react-hook-form', '@hookform/resolvers'],
  },
});
