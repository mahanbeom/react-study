import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { setToken } from '@/lib/token';
import { ToastProvider } from '@/ui';

/** 테스트마다 새 QueryClient — retry:false로 401/409가 재시도 없이 즉시 에러로 떨어지게 한다 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/**
 * 실제 라우트 트리 전체를 메모리 라우터로 렌더한다.
 * 가드 중첩·리다이렉트·useSearchParams URL 상태를 프로덕션과 동일하게 검증할 수 있다.
 * URL 단언은 router.state.location으로 한다.
 */
export function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), router, ...view };
}

/** 단일 컴포넌트용 — useNavigate/useLocation이 동작하도록 얇은 메모리 라우터로 감싼다 */
export function renderWithProviders(ui: ReactElement, { initialEntry = '/' } = {}) {
  const router = createMemoryRouter([{ path: '*', element: ui }], {
    initialEntries: [initialEntry],
  });
  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), router, ...view };
}

/** UI 로그인 절차 없이 인증 상태를 만드는 빠른 경로 — authDb의 무상태 토큰 형식을 그대로 사용 */
export function loginAs(role: 'admin' | 'member') {
  setToken(role === 'admin' ? 'mock-token-u1' : 'mock-token-u2');
}
