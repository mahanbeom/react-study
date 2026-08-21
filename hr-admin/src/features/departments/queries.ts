import { queryOptions } from '@tanstack/react-query';
import { fetchDepartments } from './api';

export const departmentKeys = {
  all: ['departments'] as const,
};

export function departmentListQuery() {
  return queryOptions({
    queryKey: departmentKeys.all,
    queryFn: fetchDepartments,
    // 세션 내 사실상 불변인 마스터 데이터 — staleTime Infinity로 앱 전체에서 한 번만 요청한다
    staleTime: Infinity,
  });
}
