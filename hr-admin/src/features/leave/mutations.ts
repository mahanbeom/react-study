import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Paginated } from '@/features/employees/types';
import { ApiError } from '@/lib/api';
import { useToast } from '@/ui';
import { createLeaveRequest, decideLeaveRequest } from './api';
import { applyDecisionToList } from './optimistic';
import { leaveKeys } from './queries';
import type { LeaveRequest } from './types';

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

/**
 * 승인/반려 — 낙관적 업데이트.
 * 서버 응답을 기다리지 않고 목록 캐시를 먼저 바꾸고(onMutate), 실패하면 스냅샷으로
 * 되돌린 뒤(onError), 성공·실패 모두 refetch로 서버 진실에 수렴한다(onSettled).
 */
export function useDecideLeaveRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: decideLeaveRequest,
    onMutate: async (input) => {
      // 1) 진행 중인 refetch가 낙관적 캐시를 되덮지 않도록 먼저 취소한다
      await queryClient.cancelQueries({ queryKey: leaveKeys.lists() });
      // 2) 탭/페이지 조합별 캐시 엔트리 전부를 스냅샷 (멀티 키)
      const snapshots = queryClient.getQueriesData<Paginated<LeaveRequest>>({
        queryKey: leaveKeys.lists(),
      });
      // 3) 모든 목록 캐시에 결정을 반영 — 화면이 즉시 바뀐다
      queryClient.setQueriesData<Paginated<LeaveRequest>>(
        { queryKey: leaveKeys.lists() },
        (data) => (data ? applyDecisionToList(data, input) : data),
      );
      return { snapshots }; // onError의 context로 전달된다
    },
    onSuccess: (_data, input) => {
      toast.success(input.action === 'approve' ? '승인했습니다.' : '반려했습니다.');
    },
    onError: (error, _input, context) => {
      // 스냅샷 복원 — 화면이 즉시 '처리 전'으로 되돌아간다
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(
        error instanceof ApiError && error.status === 409
          ? '이미 처리된 신청입니다. 목록을 갱신했습니다.'
          : '처리에 실패했습니다. 다시 시도해주세요.',
      );
    },
    // 성공·실패·409 모두 최종적으로 서버 진실로 수렴한다
    onSettled: () => queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}
