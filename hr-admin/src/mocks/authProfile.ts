import type { AuthProfile, AuthUser } from '../features/auth/types';
import type { Department } from '../features/departments/types';
import type { Employee } from '../features/employees/types';

/**
 * 저장된 계정 + 관계(직원/부서)에서 응답용 파생값을 조립한다.
 * login/me 두 핸들러가 공유해 응답 형태가 항상 같도록 보장한다
 * (useLogin이 로그인 응답을 me 캐시에 그대로 넣기 때문).
 */
export function buildAuthProfile(
  user: AuthUser,
  employees: Employee[],
  departments: Department[],
): AuthProfile {
  const employee = user.employeeId
    ? (employees.find((e) => e.id === user.employeeId) ?? null)
    : null;
  // 직원 연결이 끊겼으면(dangling) 부서/부서장 모두 파생 불가로 처리한다
  const department = employee
    ? (departments.find((d) => d.id === employee.department) ?? null)
    : null;
  const isManager =
    employee !== null && departments.some((d) => d.managerEmployeeId === employee.id);
  return { ...user, isManager, department };
}
