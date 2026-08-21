import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loginAs, renderApp } from '@/test/renderWithProviders';

// 사이드바 푸터의 부서 정보는 me 응답의 파생값(department, isManager)에서 온다
describe('AdminLayout 사이드바 사용자 정보', () => {
  it('부서장 계정이면 부서명과 부서장 배지를 보여준다', async () => {
    loginAs('manager');
    renderApp('/');

    expect(await screen.findByText('조우진')).toBeInTheDocument();
    expect(screen.getByText('개발')).toBeInTheDocument();
    expect(screen.getByText('부서장')).toBeInTheDocument();
  });

  it('일반 member 계정이면 부서명만 보이고 부서장 배지는 없다', async () => {
    loginAs('member');
    renderApp('/');

    expect(await screen.findByText('윤하은')).toBeInTheDocument();
    expect(screen.getByText('개발')).toBeInTheDocument();
    expect(screen.queryByText('부서장')).not.toBeInTheDocument();
  });

  it('직원과 연결되지 않은 계정(admin)이면 부서 정보가 없다', async () => {
    loginAs('admin');
    renderApp('/');

    expect(await screen.findByText('김관리')).toBeInTheDocument();
    expect(screen.queryByText('개발')).not.toBeInTheDocument();
    expect(screen.queryByText('부서장')).not.toBeInTheDocument();
  });
});
