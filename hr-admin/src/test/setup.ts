// jest-dom의 vitest 엔트리 — expect에 toBeInTheDocument 등 매처 등록 + 타입 확장
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetDb } from '@/mocks/db';
import { resetLeaveDb } from '@/mocks/leaveDb';
import { server } from '@/mocks/server';

// 핸들러가 없는 요청은 조용히 실패하는 대신 테스트를 즉시 깨뜨린다
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers(); // 테스트별 server.use 오버라이드 제거
  cleanup(); // globals:false라 RTL 자동 cleanup이 등록되지 않는다 — 수동 호출 필수
  localStorage.clear(); // 토큰 등 저장소 격리 (jsdom은 파일 내에서 localStorage를 유지한다)
  resetDb(); // leave 시드가 직원 목록을 읽으므로 employees를 먼저 리셋한다
  resetLeaveDb();
});

afterAll(() => server.close());
