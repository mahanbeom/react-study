import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchLeaveRequests } from './api';
import type { LeaveListParams } from './types';

export const leaveKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveKeys.all, 'list'] as const,
  list: (params: LeaveListParams) => [...leaveKeys.lists(), params] as const,
};

export function leaveListQuery(params: LeaveListParams) {
  return queryOptions({
    queryKey: leaveKeys.list(params),
    queryFn: () => fetchLeaveRequests(params),
    placeholderData: keepPreviousData,
  });
}
