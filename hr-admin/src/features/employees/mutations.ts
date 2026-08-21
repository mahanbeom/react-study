import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/queries';
import { useToast } from '@/ui';
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

// 성공 토스트는 훅(피드백의 단일 지점)에, 내비게이션 등 화면 고유 후속은 호출부의
// mutate(vars, { onSuccess })에 둔다 — v5는 훅/호출부 콜백을 둘 다 실행한다.
// 에러는 화면에 컨텍스트가 남아 있으므로(폼 필드, 다이얼로그) 인라인 표시를 유지한다.
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('직원을 등록했습니다.');
      return invalidateEmployeeData(queryClient);
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => updateEmployee(id, values),
    onSuccess: () => {
      toast.success('저장했습니다.');
      return invalidateEmployeeData(queryClient);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('삭제했습니다.');
      return invalidateEmployeeData(queryClient);
    },
  });
}
