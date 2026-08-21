import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loginAs, renderApp } from '@/test/renderWithProviders';

/** 헤더 행을 제외한 데이터 행 개수 */
function countDataRows() {
  return screen.getAllByRole('row').length - 1;
}

describe('EmployeeListPage', () => {
  it('첫 페이지에 10명을 렌더하고 전체 건수를 보여준다', async () => {
    loginAs('admin');
    renderApp('/employees');

    expect(await screen.findByText('총 52건')).toBeInTheDocument();
    expect(countDataRows()).toBe(10);
    // admin에게는 등록 버튼이 보인다
    expect(screen.getByRole('button', { name: '직원 등록' })).toBeInTheDocument();
  });

  it('검색어를 입력하면 디바운스 후 URL에 반영되고 목록이 필터링된다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/employees');
    await screen.findByText('총 52건');

    await user.type(screen.getByPlaceholderText('이름 또는 이메일 검색'), 'member01');

    // SearchInput의 300ms 디바운스가 지난 뒤 URL이 갱신된다
    await waitFor(() => expect(router.state.location.search).toBe('?search=member01'));
    expect(await screen.findByText('총 1건')).toBeInTheDocument();
    expect(countDataRows()).toBe(1);
  });

  it('페이지를 이동하면 URL에 page가 반영되고 다른 행이 렌더된다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/employees');
    await screen.findByText('총 52건');
    const firstRowName = within(screen.getAllByRole('row')[1]!).getAllByText(/.+/)[0]!.textContent;

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    await waitFor(() => {
      const newFirstRowName = within(screen.getAllByRole('row')[1]!).getAllByText(/.+/)[0]!
        .textContent;
      expect(newFirstRowName).not.toBe(firstRowName);
    });
  });

  it('필터를 바꾸면 page가 1로 리셋된다', async () => {
    loginAs('admin');
    const { user, router } = renderApp('/employees?page=2');
    await screen.findByText('총 52건');

    // 상태 Select(3번째 combobox 아님 — 0: 부서, 1: 상태)에서 퇴사를 고른다
    const [, statusSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelect!, '퇴사');

    await waitFor(() => expect(router.state.location.search).toBe('?status=resigned'));
    // 퇴사자는 시드에서 10명이다 (대시보드 집계와 일치)
    expect(await screen.findByText('총 10건')).toBeInTheDocument();
  });

  it('URL 직접 진입 시 검색어 입력값과 결과가 복원된다', async () => {
    loginAs('admin');
    renderApp('/employees?search=member01');

    expect(await screen.findByText('총 1건')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이름 또는 이메일 검색')).toHaveValue('member01');
  });

  it('member 역할에게는 직원 등록 버튼이 보이지 않는다', async () => {
    loginAs('member');
    renderApp('/employees');

    expect(await screen.findByText('총 52건')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '직원 등록' })).not.toBeInTheDocument();
  });
});
