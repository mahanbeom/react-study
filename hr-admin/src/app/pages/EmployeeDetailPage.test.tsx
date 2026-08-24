import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeLeaveBalance } from '@/features/leave/balance';
import { listLeaveRequests } from '@/mocks/leaveDb';
import { loginAs, renderApp } from '@/test/renderWithProviders';

describe('EmployeeDetailPage', () => {
  it('삭제 확인 시 성공 토스트를 띄우고 목록으로 이동한다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/employees/1');

    await user.click(await screen.findByRole('button', { name: '삭제' }));
    // ConfirmDialog 안의 삭제 버튼 (마지막에 렌더된 것)
    const confirmButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(router.state.location.pathname).toBe('/employees'));
    // 토스트(훅 레벨)가 라우트 이동을 살아남는다 — 루트 마운트의 가치
    expect(screen.getByRole('status')).toHaveTextContent('삭제했습니다.');
  });

  it('member 역할에게는 수정·삭제 버튼이 보이지 않는다', async () => {
    loginAs('member');
    renderApp('/employees/1');

    expect(await screen.findByRole('button', { name: '목록' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
  });

  it('올해 연차 현황 카드에 부여/사용/대기/잔여를 보여준다', async () => {
    loginAs('admin');
    renderApp('/employees/1');

    // 기대값은 시드 하드코딩 대신 같은 파생 함수로 계산한다
    const balance = computeLeaveBalance(listLeaveRequests(), '1', new Date().getUTCFullYear());
    const card = (await screen.findByRole('heading', { name: /년 연차/ })).parentElement!;
    expect(within(card).getByText(`${balance.granted}일`)).toBeInTheDocument();
    expect(within(card).getByText(`잔여`)).toBeInTheDocument();
    expect(within(card).getByText(`${balance.remaining}일`)).toBeInTheDocument();
  });
});
