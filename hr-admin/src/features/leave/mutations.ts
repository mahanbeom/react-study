import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { createLeaveRequest, decideLeaveRequest } from './api';
import { leaveKeys } from './queries';

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}

export function useDecideLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
    onError: (error) => {
      // 이미 처리된 신청(409)이면 다른 화면에서 처리된 것 — 목록을 최신으로 갱신한다
      if (error instanceof ApiError && error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}
