import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// vite.config 를 그대로 물려받는다 — 플러그인(react/tailwind)이 테스트에서도 같아야 한다.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setup-vitest.ts'],
      // globals 를 켜지 않는다. describe/test/expect 를 파일마다 명시적으로 import 하면
      // 별도 타입 선언(global.d.ts)이 필요 없고, 어디서 온 함수인지도 드러난다.
      globals: false,
    },
  }),
);
