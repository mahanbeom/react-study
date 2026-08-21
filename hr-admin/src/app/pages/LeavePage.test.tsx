import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { loginAs, renderApp } from '@/test/renderWithProviders';

// "승인"/"반려"/"대기"는 탭·다이얼로그·배지에 모두 등장하므로 반드시 within()으로 스코프를 좁힌다

/** 대기 탭 첫 번째 데이터 행 */
function firstRow() {
  return screen.getAllByRole('row')[1]!;
}

async function renderPendingTab() {
  loginAs('admin');
  const view = renderApp('/leave');
  await screen.findByText(/총 \d+건/);
  return view;
}

/** 첫 행의 승인 버튼 → 확인 다이얼로그의 승인 버튼 클릭 */
async function approveFirstRow(user: Awaited<ReturnType<typeof renderPendingTab>>['user']) {
  await user.click(within(firstRow()).getByRole('button', { name: '승인' }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '승인' }));
}

describe('LeavePage 낙관적 업데이트', () => {
  it('서버 응답 전에 다이얼로그가 닫히고 행 상태가 즉시 바뀐다', async () => {
    // 영원히 응답하지 않는 핸들러 — 이후의 단언이 전부 "서버 응답 전"임을 구조적으로 보장
    server.use(http.patch('/api/leave-requests/:id/decision', () => new Promise<never>(() => {})));
    const { user } = await renderPendingTab();

    await approveFirstRow(user);

    // 다이얼로그는 기다리지 않고 즉시 닫힌다
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    // 행 배지가 대기 → 승인으로 바뀌고, pending 조건이던 승인/반려 버튼이 사라진다
    expect(within(firstRow()).getByText('승인')).toBeInTheDocument();
    expect(within(firstRow()).queryByRole('button', { name: '승인' })).not.toBeInTheDocument();
  });

  it('서버가 500이면 스냅샷으로 롤백되고 에러 토스트가 뜬다', async () => {
    server.use(
      http.patch('/api/leave-requests/:id/decision', () =>
        HttpResponse.json({ message: '서버 오류' }, { status: 500 }),
      ),
    );
    const { user } = await renderPendingTab();

    await approveFirstRow(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('처리에 실패했습니다');
    // 롤백 — 행이 다시 대기 상태로 돌아오고 승인 버튼이 복귀한다
    await waitFor(() =>
      expect(within(firstRow()).getByRole('button', { name: '승인' })).toBeInTheDocument(),
    );
    expect(within(firstRow()).getByText('대기')).toBeInTheDocument();
  });

  it('409(이미 처리됨)면 전용 토스트를 띄우고 refetch로 서버 진실에 수렴한다', async () => {
    server.use(
      http.patch('/api/leave-requests/:id/decision', () =>
        HttpResponse.json({ message: '이미 처리된 신청입니다' }, { status: 409 }),
      ),
    );
    const { user } = await renderPendingTab();

    await approveFirstRow(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 처리된 신청입니다');
    // onSettled refetch — mock DB(시드)에선 여전히 pending이므로 승인 버튼이 돌아온다
    await waitFor(() =>
      expect(within(firstRow()).getByRole('button', { name: '승인' })).toBeInTheDocument(),
    );
  });

  it('반려 성공 시 토스트가 뜨고 refetch 후 대기 탭에서 행이 사라진다', async () => {
    const { user } = await renderPendingTab();
    const initialTotal = screen.getByText(/총 \d+건/).textContent;

    await user.click(within(firstRow()).getByRole('button', { name: '반려' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^반려 사유/), '업무 일정과 겹칩니다');
    await user.click(within(dialog).getByRole('button', { name: '반려' }));

    expect(await screen.findByRole('status')).toHaveTextContent('반려했습니다.');
    // 실제 핸들러가 처리 → refetch 후 대기 목록에서 빠져 총 건수가 줄어든다
    await waitFor(() => expect(screen.getByText(/총 \d+건/).textContent).not.toBe(initialTotal));
  });
});
