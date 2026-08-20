import { describe, expect, it } from 'vitest';
import { authenticate, issueToken, resolveAuthHeader } from './authDb';

describe('authenticate', () => {
  it('올바른 자격 증명이면 비밀번호를 제외한 사용자를 반환한다', () => {
    const user = authenticate('admin@hrcorp.dev', 'admin123');
    expect(user).toMatchObject({ email: 'admin@hrcorp.dev', role: 'admin' });
    expect(user && 'password' in user).toBe(false);
  });

  it('비밀번호가 틀리면 null을 반환한다', () => {
    expect(authenticate('admin@hrcorp.dev', 'wrong')).toBeNull();
  });

  it('없는 이메일이면 null을 반환한다', () => {
    expect(authenticate('nobody@hrcorp.dev', 'admin123')).toBeNull();
  });
});

describe('토큰 발급/검증 (무상태 왕복)', () => {
  it('발급한 토큰을 Authorization 헤더로 되돌리면 같은 사용자가 나온다', () => {
    const admin = authenticate('admin@hrcorp.dev', 'admin123')!;
    const token = issueToken(admin.id);
    const resolved = resolveAuthHeader(`Bearer ${token}`);
    expect(resolved).toEqual(admin);
  });

  it('위조 토큰은 null을 반환한다', () => {
    expect(resolveAuthHeader('Bearer mock-token-999')).toBeNull();
    expect(resolveAuthHeader('Bearer totally-fake')).toBeNull();
  });

  it('헤더가 없거나 Bearer 형식이 아니면 null을 반환한다', () => {
    expect(resolveAuthHeader(null)).toBeNull();
    expect(resolveAuthHeader('Basic abc')).toBeNull();
  });
});
