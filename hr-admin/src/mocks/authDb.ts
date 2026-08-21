import type { AuthUser } from '../features/auth/types';

interface MockUser extends AuthUser {
  password: string;
}

// 연습용 데모 계정 — 로그인 화면에 안내된다. member 계정은 직원 시드와 1:1 연결
const USERS: MockUser[] = [
  // admin은 직원이 아닐 수 있다 — employeeId null 허용의 근거
  {
    id: 'u1',
    name: '김관리',
    email: 'admin@hrcorp.dev',
    password: 'admin123',
    role: 'admin',
    employeeId: null,
  },
  // 직원 '22' 윤하은(개발팀 대리, 비부서장) — 이름도 직원과 일치시킨다
  {
    id: 'u2',
    name: '윤하은',
    email: 'member@hrcorp.dev',
    password: 'member123',
    role: 'member',
    employeeId: '22',
  },
  // 직원 '1' 조우진(개발팀 부서장) — role은 member 그대로, 부서장 여부는 부서 관계에서 파생된다
  {
    id: 'u3',
    name: '조우진',
    email: 'manager@hrcorp.dev',
    password: 'manager123',
    role: 'member',
    employeeId: '1',
  },
];

const TOKEN_PREFIX = 'mock-token-';

function toAuthUser({ id, name, email, role, employeeId }: MockUser): AuthUser {
  return { id, name, email, role, employeeId };
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
