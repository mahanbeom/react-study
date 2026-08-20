import type { AuthUser } from '../features/auth/types';

interface MockUser extends AuthUser {
  password: string;
}

// 연습용 데모 계정 — 로그인 화면에 안내된다
const USERS: MockUser[] = [
  { id: 'u1', name: '김관리', email: 'admin@hrcorp.dev', password: 'admin123', role: 'admin' },
  { id: 'u2', name: '이멤버', email: 'member@hrcorp.dev', password: 'member123', role: 'member' },
];

const TOKEN_PREFIX = 'mock-token-';

function toAuthUser({ id, name, email, role }: MockUser): AuthUser {
  return { id, name, email, role };
}

export function authenticate(email: string, password: string): AuthUser | null {
  const user = USERS.find((u) => u.email === email && u.password === password);
  return user ? toAuthUser(user) : null;
}

/**
 * 무상태 토큰: userId를 토큰에 담아 발급한다.
 * 새로고침으로 인메모리 상태가 사라져도 토큰만으로 사용자를 복원할 수 있다.
 */
export function issueToken(userId: string): string {
  return TOKEN_PREFIX + userId;
}

export function resolveAuthHeader(header: string | null): AuthUser | null {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const userId = token.slice(TOKEN_PREFIX.length);
  const user = USERS.find((u) => u.id === userId);
  return user ? toAuthUser(user) : null;
}
