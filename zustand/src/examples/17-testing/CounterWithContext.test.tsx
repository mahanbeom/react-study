import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { CounterWithContext } from './CounterWithContext.tsx';

// 같은 세 테스트인데 이쪽은 mock 이 없어도 절대 안 깨진다.
// Provider 가 렌더될 때마다 useState(() => createCounterStore()) 로 스토어를
// 새로 만들기 때문이다 — 15 에서 만든 격리가 테스트 격리로 그대로 이어진다.

describe('CounterWithContext (Context 스토어)', () => {
  test('초기값 1 로 렌더된다', async () => {
    render(<CounterWithContext />);

    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  test('버튼을 누르면 2 가 된다', async () => {
    const user = userEvent.setup();
    render(<CounterWithContext />);

    await user.click(screen.getByRole('button', { name: /one up/i }));

    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  test('다음 테스트도 1 에서 시작한다', async () => {
    render(<CounterWithContext />);

    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});
