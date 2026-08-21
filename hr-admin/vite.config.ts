import path from 'node:path';
// 'vite' 대신 'vitest/config' — defineConfig에 test 키 타입이 포함된다
import { defineConfig } from 'vitest/config';
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
  test: {
    // Vitest 4 projects — 순수 함수 테스트(*.test.ts)는 빠른 node 환경 그대로 두고,
    // 컴포넌트 테스트(*.test.tsx)만 jsdom + MSW setup을 얹는다
    projects: [
      {
        extends: true, // 루트 설정(plugins, alias) 상속
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
