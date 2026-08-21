import type { DepartmentId } from '../employees/types';

/**
 * 부서 엔티티 — 문자열 union에서 승격됐다.
 * 부서장(managerEmployeeId)은 role이 아니라 이 관계에서 파생된다:
 * "isManager = 나를 부서장으로 가리키는 부서가 있는가"
 */
export interface Department {
  id: DepartmentId;
  name: string;
  managerEmployeeId: string;
}
