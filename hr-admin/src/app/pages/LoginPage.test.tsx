import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { getToken } from '@/lib/token';
import { server } from '@/mocks/server';
import { renderApp } from '@/test/renderWithProviders';

describe('LoginPage', () => {
  it('로그인 화면을 렌더한다', async () => {
    renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'HR Admin 로그인' })).toBeInTheDocument();
  });

  it('빈 폼 제출 시 zod 검증 에러를 보여주고 서버 에러는 띄우지 않는다', async () => {
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('button', { name: '로그인' }));

    expect(await screen.findByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력하세요')).toBeInTheDocument();
    // resolver가 제출을 막았으므로 401 root 에러는 나타나지 않아야 한다
    expect(screen.queryByText('이메일 또는 비밀번호가 올바르지 않습니다')).not.toBeInTheDocument();
  });

  it('틀린 자격증명이면 401 root 에러 메시지를 보여준다', async () => {
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('이메일'), 'admin@hrcorp.dev');
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument();
  });

  it('로그인 성공 시 토큰을 저장하고 대시보드로 이동한다', async () => {
    const { user, router } = renderApp('/login');

    await user.type(await screen.findByLabelText('이메일'), 'admin@hrcorp.dev');
    await user.type(screen.getByLabelText('비밀번호'), 'admin123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(getToken()).toBe('mock-token-u1');
  });

  it('미인증 접근 경로를 기억했다가 로그인 후 그 경로로 복귀한다', async () => {
    const { user, router } = renderApp('/employees');

    // RequireAuth가 /login으로 보낸다
    await screen.findByRole('heading', { name: 'HR Admin 로그인' });
    expect(router.state.location.pathname).toBe('/login');

    await user.type(screen.getByLabelText('이메일'), 'member@hrcorp.dev');
    await user.type(screen.getByLabelText('비밀번호'), 'member123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/employees'));
  });

  it('제출 중에는 버튼이 비활성화된다', async () => {
    // 응답을 늦춰 pending 상태를 관찰할 수 있게 한다
    server.use(
      http.post('/api/auth/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ message: '지연 응답' }, { status: 401 });
      }),
    );
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('이메일'), 'admin@hrcorp.dev');
    await user.type(screen.getByLabelText('비밀번호'), 'admin123');
    const button = screen.getByRole('button', { name: '로그인' });
    await user.click(button);

    expect(button).toBeDisabled();
    // 응답이 돌아오면 다시 활성화된다
    await waitFor(() => expect(button).toBeEnabled());
  });
});
