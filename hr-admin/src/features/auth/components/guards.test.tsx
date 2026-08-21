import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getToken, setToken } from '@/lib/token';
import { loginAs, renderApp } from '@/test/renderWithProviders';

describe('RequireAuth', () => {
  it('토큰이 없으면 로그인 화면으로 보낸다', async () => {
    const { router } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'HR Admin 로그인' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('무효 토큰이면(me 401) 토큰을 정리하고 로그인 화면으로 보낸다', async () => {
    setToken('mock-token-u99'); // 존재하지 않는 사용자

    const { router } = renderApp('/');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(getToken()).toBeNull();
  });

  it('토큰 복원 중에는 중간 상태를 보여준다', () => {
    loginAs('admin');
    renderApp('/');

    // /auth/me 응답이 오기 전 첫 렌더 직후
    expect(screen.getByText('확인 중…')).toBeInTheDocument();
  });
});

describe('RequireRole', () => {
  it('member가 직원 등록 화면에 진입하면 홈으로 돌려보낸다', async () => {
    loginAs('member');
    const { router } = renderApp('/employees/new');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    // 홈(대시보드)이 렌더된다 — "대시보드" 텍스트는 사이드바에도 있어 고유 텍스트로 단언
    expect(await screen.findByText('재직 인원')).toBeInTheDocument();
  });

  it('admin은 직원 등록 폼을 볼 수 있다', async () => {
    loginAs('admin');
    const { router } = renderApp('/employees/new');

    expect(await screen.findByLabelText(/^이름/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/employees/new');
  });
});
