import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { Counter } from './Counter.tsx';

// 이 파일의 두 테스트는 "각각 1 에서 시작한다" 고 가정한다.
// 전역 스토어는 모듈 하나당 한 번만 만들어지므로, 앞 테스트가 올린 값이
// 뒤 테스트로 그대로 넘어간다 — __mocks__/zustand.ts 의 TODO ① 이 그걸 막는다.

describe('Counter (전역 스토어)', () => {
  test('초기값 1 로 렌더된다', async () => {
    render(<Counter />);

    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  test('버튼을 누르면 2 가 된다', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    // ↓ 여기가 핵심. 앞 테스트가 남긴 값이 있으면 이 줄부터 깨진다.
    expect(await screen.findByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /one up/i }));

    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  test('한 번 더 눌러도 여전히 1 에서 시작한다', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(await screen.findByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /one up/i }));

    expect(await screen.findByText('2')).toBeInTheDocument();
  });
});
