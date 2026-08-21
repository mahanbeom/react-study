import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderWithProviders';

describe('LoginPage', () => {
  it('로그인 화면을 렌더한다 (인프라 스모크)', async () => {
    renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'HR Admin 로그인' })).toBeInTheDocument();
  });
});
