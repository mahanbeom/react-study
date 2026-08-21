import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { useToast } from '@/ui';
import { createLeaveRequest, decideLeaveRequest } from './api';
import { leaveKeys } from './queries';

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      // 신청 후 목록으로 이동하므로 화면 컨텍스트가 사라진다 — 토스트로 피드백
      toast.success('휴가를 신청했습니다.');
      return queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
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
