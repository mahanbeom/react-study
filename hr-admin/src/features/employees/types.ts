export const DEPARTMENTS = ['engineering', 'design', 'product', 'hr', 'finance', 'sales'] as const;
// 부서가 엔티티(features/departments)로 승격되면서 union은 "부서 id"의 역할만 남는다
export type DepartmentId = (typeof DEPARTMENTS)[number];

export const EMPLOYEE_STATUSES = ['active', 'onLeave', 'resigned'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: DepartmentId;
  position: string;
  status: EmployeeStatus;
  /** ISO 날짜 (YYYY-MM-DD) — 4단계 입퇴사 추이 차트에 사용 */
  hiredAt: string;
  resignedAt: string | null;
}

export interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  /** 이름/이메일 부분 일치, 대소문자 무시 */
  search?: string;
  department?: DepartmentId;
  status?: EmployeeStatus;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
