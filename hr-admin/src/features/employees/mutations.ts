import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployee, deleteEmployee, updateEmployee } from './api';
import { employeeKeys } from './queries';
import type { EmployeeFormValues } from './schema';

// 성공 시 목록/상세 캐시를 한꺼번에 무효화한다 (employeeKeys.all이 공통 접두사)
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => updateEmployee(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
