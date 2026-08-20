import type { Paginated } from '../features/employees/types';
import type { LeaveListParams, LeaveRequest } from '../features/leave/types';

const DEFAULT_PAGE_SIZE = 10;

/** 휴가 신청 목록 API 시뮬레이션 — 상태 필터 + 신청일 최신순 + 페이지네이션 */
export function queryLeaveRequests(
  requests: LeaveRequest[],
  params: LeaveListParams,
): Paginated<LeaveRequest> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const filtered = params.status ? requests.filter((r) => r.status === params.status) : requests;
  const sorted = filtered.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}
