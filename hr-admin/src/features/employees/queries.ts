import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchEmployees } from './api';
import type { EmployeeListParams } from './types';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
};

export function employeeListQuery(params: EmployeeListParams) {
  return queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: () => fetchEmployees(params),
    // 페이지/필터 전환 시 이전 데이터를 유지해 화면 깜빡임을 막는다
    placeholderData: keepPreviousData,
  });
}
