import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node(테스트)용 MSW 서버 — 브라우저 worker(browser.ts)와 동일한 handlers를 공유한다
export const server = setupServer(...handlers);
