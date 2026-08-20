import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/queries';
import { createEmployee, deleteEmployee, updateEmployee } from './api';
import { employeeKeys } from './queries';
import type { EmployeeFormValues } from './schema';

// 직원 데이터가 바뀌면 직원 목록/상세뿐 아니라 이를 집계하는 대시보드도 함께 무효화한다
function invalidateEmployeeData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => invalidateEmployeeData(queryClient),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => updateEmployee(id, values),
    onSuccess: () => invalidateEmployeeData(queryClient),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => invalidateEmployeeData(queryClient),
  });
}
