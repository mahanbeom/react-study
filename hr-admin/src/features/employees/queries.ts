import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { fetchEmployee, fetchEmployees } from './api';
import type { EmployeeListParams } from './types';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export function employeeListQuery(params: EmployeeListParams) {
  return queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: () => fetchEmployees(params),
    // 페이지/필터 전환 시 이전 데이터를 유지해 화면 깜빡임을 막는다
    placeholderData: keepPreviousData,
  });
}

export function employeeDetailQuery(id: string) {
  return queryOptions({
    queryKey: employeeKeys.detail(id),
    queryFn: () => fetchEmployee(id),
    // 404는 재시도해도 의미가 없다
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
}
