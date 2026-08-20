import type { Employee, EmployeeListParams, Paginated } from '../features/employees/types';

const DEFAULT_PAGE_SIZE = 10;

/** 실제 백엔드의 목록 API(검색/필터/페이지네이션)를 시뮬레이션하는 순수 함수 */
export function queryEmployees(
  employees: Employee[],
  params: EmployeeListParams,
): Paginated<Employee> {
  const { department, status } = params;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = params.search?.trim().toLowerCase();

  const filtered = employees.filter((e) => {
    if (department && e.department !== department) return false;
    if (status && e.status !== status) return false;
    if (search && !e.name.toLowerCase().includes(search) && !e.email.toLowerCase().includes(search))
      return false;
    return true;
  });

  const sorted = filtered.toSorted((a, b) => b.hiredAt.localeCompare(a.hiredAt));
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}
