import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { computeLeaveBalance } from '@/features/leave/balance';
import { listLeaveRequests } from '@/mocks/leaveDb';
import { server } from '@/mocks/server';
import { loginAs, renderApp } from '@/test/renderWithProviders';

// 시드에 실제로 승인 이력이 있는 직원 — 기대값은 하드코딩 대신 시드에서 계산한다
const EMPLOYEE_ID = '1';
const YEAR = 2026;

/** 신청 폼을 열고 직원까지 선택한 상태를 만든다 */
async function openFormWithEmployee(user: ReturnType<typeof renderApp>['user']) {
  // 직원 목록이 로드돼야 옵션이 생긴다 (0: 직원, 1: 유형)
  const employeeOption = await screen.findByRole('option', { name: /조우진/ });
  const [employeeSelect] = screen.getAllByRole('combobox');
  await user.selectOptions(employeeSelect!, (employeeOption as HTMLOptionElement).value);
}

async function fillDates(
  user: ReturnType<typeof renderApp>['user'],
  startDate: string,
  endDate: string,
) {
  await user.type(screen.getByLabelText(/^시작일/), startDate);
  await user.type(screen.getByLabelText(/^종료일/), endDate);
  await user.type(screen.getByLabelText(/^사유/), '가족 여행');
}

describe('LeaveCreatePage 잔여 연차', () => {
  it('직원을 선택하면 잔여 연차를 보여준다', async () => {
    loginAs('admin');
    const { user } = renderApp('/leave/new');
    await openFormWithEmployee(user);

    const balance = computeLeaveBalance(listLeaveRequests(), EMPLOYEE_ID, YEAR);
    expect(await screen.findByText(new RegExp(`잔여 연차 ${balance.remaining}일`))).toBeInTheDocument();
  });

  it('잔여를 초과하는 연차는 제출 전에 막는다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/leave/new');
    await openFormWithEmployee(user);
    await screen.findByText(/잔여 연차/);

    await fillDates(user, '2026-09-01', '2026-09-30'); // 30일 — 15일 부여를 초과
    await user.click(screen.getByRole('button', { name: '신청' }));

    expect(await screen.findByText(/잔여 연차\(.+\)를 초과합니다/)).toBeInTheDocument();
    // 서버로 나가지 않았으므로 목록으로 이동하지 않는다
    expect(router.state.location.pathname).toBe('/leave/new');
  });

  it('잔여 이내면 신청이 성공하고 목록으로 이동한다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/leave/new');
    await openFormWithEmployee(user);
    await screen.findByText(/잔여 연차/);

    await fillDates(user, '2026-09-01', '2026-09-03'); // 3일
    await user.click(screen.getByRole('button', { name: '신청' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/leave'));
    expect(router.state.location.search).toBe('?status=pending');
  });

  it('반차인데 기간이 이틀이면 스키마 검증에 걸린다', async () => {
    loginAs('admin');
    const { user } = renderApp('/leave/new');
    await openFormWithEmployee(user);

    const [, typeSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(typeSelect!, '반차');
    await fillDates(user, '2026-09-01', '2026-09-02');
    await user.click(screen.getByRole('button', { name: '신청' }));

    expect(await screen.findByText('반차는 하루만 신청할 수 있습니다')).toBeInTheDocument();
  });

  it('잔여 조회가 실패해도 서버가 초과 신청을 400으로 막는다', async () => {
    // 클라이언트 사전 검증을 무력화해 서버 안전망만 남긴다
    server.use(
      http.get('/api/leave-balances', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    loginAs('admin');
    const { user } = renderApp('/leave/new');
    await openFormWithEmployee(user);

    await fillDates(user, '2026-09-01', '2026-09-30');
    await user.click(screen.getByRole('button', { name: '신청' }));

    expect(
      await screen.findByText('신청에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });
});
