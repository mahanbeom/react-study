import type { Paginated } from '@/features/employees/types';
import type { LeaveDecisionInput } from './api';
import type { LeaveRequest } from './types';

/**
 * 목록 캐시 한 페이지에 승인/반려 결정을 낙관적으로 반영한다.
 * - workflow.decide()와 같은 전이 규칙: pending인 신청만 종결할 수 있다
 * - UI가 그리는 필드(status, rejectReason)만 바꾼다 — decidedAt은 목록에 표시되지
 *   않으므로 서버 값을 지어내지 않는다
 * - 필터 소속·total 정리는 onSettled의 refetch(서버 진실)가 담당한다
 */
export function applyDecisionToList(
  data: Paginated<LeaveRequest>,
  input: LeaveDecisionInput,
): Paginated<LeaveRequest> {
  return {
    ...data,
    items: data.items.map((r) =>
      r.id === input.id && r.status === 'pending'
        ? {
            ...r,
            status: input.action === 'approve' ? 'approved' : 'rejected',
            rejectReason: input.action === 'reject' ? (input.rejectReason?.trim() ?? null) : null,
          }
        : r,
    ),
  };
}
