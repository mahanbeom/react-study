import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../features/auth/types';
import type { Department } from '../features/departments/types';
import type { Employee } from '../features/employees/types';
import { buildAuthProfile } from './authProfile';

const EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: '조우진',
    email: 'e1@hrcorp.dev',
    department: 'engineering',
    position: '차장',
    status: 'active',
    hiredAt: '2023-01-01',
    resignedAt: null,
  },
  {
    id: 'e2',
    name: '윤하은',
    email: 'e2@hrcorp.dev',
    department: 'engineering',
    position: '대리',
    status: 'active',
    hiredAt: '2024-05-20',
    resignedAt: null,
  },
];

const DEPARTMENTS_FIXTURE: Department[] = [
  { id: 'engineering', name: '개발', managerEmployeeId: 'e1' },
  { id: 'design', name: '디자인', managerEmployeeId: 'e9' },
];

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'u1',
    name: '테스트',
    email: 'test@hrcorp.dev',
    role: 'member',
    employeeId: null,
    ...overrides,
  };
}

describe('buildAuthProfile', () => {
  it('직원과 연결되지 않은 계정(admin 등)은 부서 없음/비부서장이다', () => {
    const profile = buildAuthProfile(makeUser({ role: 'admin' }), EMPLOYEES, DEPARTMENTS_FIXTURE);
    expect(profile).toMatchObject({ role: 'admin', department: null, isManager: false });
  });

  it('부서를 관리하는 직원과 연결된 계정은 isManager가 true다', () => {
    const profile = buildAuthProfile(
      makeUser({ employeeId: 'e1' }),
      EMPLOYEES,
      DEPARTMENTS_FIXTURE,
    );
    expect(profile.isManager).toBe(true);
    expect(profile.department).toMatchObject({ id: 'engineering', name: '개발' });
  });

  it('일반 직원과 연결된 계정은 부서는 있지만 isManager가 false다', () => {
    const profile = buildAuthProfile(
      makeUser({ employeeId: 'e2' }),
      EMPLOYEES,
      DEPARTMENTS_FIXTURE,
    );
    expect(profile.isManager).toBe(false);
    expect(profile.department?.id).toBe('engineering');
  });

  it('연결된 직원이 삭제됐으면(dangling) 부서 없음/비부서장으로 파생한다', () => {
    const profile = buildAuthProfile(
      makeUser({ employeeId: 'gone' }),
      EMPLOYEES,
      DEPARTMENTS_FIXTURE,
    );
    expect(profile).toMatchObject({ department: null, isManager: false });
  });
});
