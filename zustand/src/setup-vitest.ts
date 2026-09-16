import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// RTL 은 전역 afterEach 가 있을 때만 스스로 cleanup 을 건다. 이 프로젝트는
// globals 를 끄고 명시적 import 를 쓰므로 여기서 직접 걸어준다.
// (빠뜨리면 render 결과가 테스트마다 쌓여 "found multiple elements" 가 난다)
afterEach(cleanup);

// 이 한 줄이 __mocks__/zustand.ts 를 실제 zustand 대신 쓰게 만든다.
// Jest 는 node_modules 를 자동 모킹하지만 Vitest 는 명시해야 한다.
vi.mock('zustand');
