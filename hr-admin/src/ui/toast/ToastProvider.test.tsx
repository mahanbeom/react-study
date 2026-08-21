import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

/** 토스트를 발화시키는 테스트 하네스 — src/ui 격리 확인 겸 renderApp 없이 직접 렌더 */
function Harness() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success('저장했습니다.')}>
        성공 발화
      </button>
      <button type="button" onClick={() => toast.error('실패했습니다.')}>
        에러 발화
      </button>
    </div>
  );
}

function renderHarness() {
  render(
    <ToastProvider successDuration={50} errorDuration={50}>
      <Harness />
    </ToastProvider>,
  );
  return userEvent.setup();
}

describe('ToastProvider', () => {
  it('success 토스트는 role=status로 나타나고 지정 시간 후 자동으로 사라진다', async () => {
    const user = renderHarness();

    await user.click(screen.getByRole('button', { name: '성공 발화' }));

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('저장했습니다.');
    await waitForElementToBeRemoved(toast);
  });

  it('error 토스트는 role=alert이며 닫기 버튼으로 즉시 닫힌다', async () => {
    const user = renderHarness();

    await user.click(screen.getByRole('button', { name: '에러 발화' }));

    const toast = screen.getByRole('alert');
    expect(toast).toHaveTextContent('실패했습니다.');
    await user.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('연속 호출하면 여러 개가 쌓여 렌더된다', async () => {
    const user = renderHarness();

    await user.click(screen.getByRole('button', { name: '성공 발화' }));
    await user.click(screen.getByRole('button', { name: '성공 발화' }));
    await user.click(screen.getByRole('button', { name: '에러 발화' }));

    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
