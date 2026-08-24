import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchLeaveBalance, fetchLeaveRequests } from './api';
import type { LeaveListParams } from './types';

export const leaveKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveKeys.all, 'list'] as const,
  list: (params: LeaveListParams) => [...leaveKeys.lists(), params] as const,
  // all 하위에 두면 신청/승인/반려 뮤테이션의 invalidate(leaveKeys.all)가 잔여까지 갱신한다
  balances: () => [...leaveKeys.all, 'balance'] as const,
  balance: (employeeId: string, year: number) =>
    [...leaveKeys.balances(), employeeId, year] as const,
};

export function leaveListQuery(params: LeaveListParams) {
  return queryOptions({
    queryKey: leaveKeys.list(params),
    queryFn: () => fetchLeaveRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function leaveBalanceQuery(employeeId: string, year: number) {
  return queryOptions({
    queryKey: leaveKeys.balance(employeeId, year),
    queryFn: () => fetchLeaveBalance(employeeId, year),
  });
}
