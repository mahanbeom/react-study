import { api } from '@/lib/api';
import type { Paginated } from '@/features/employees/types';
import type { LeaveRequestFormValues } from './schema';
import type { LeaveListParams, LeaveRequest } from './types';
import type { LeaveDecisionAction } from './workflow';

export function fetchLeaveRequests(params: LeaveListParams = {}): Promise<Paginated<LeaveRequest>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.status) qs.set('status', params.status);
  const query = qs.toString();
  return api(`/leave-requests${query ? `?${query}` : ''}`);
}

export function createLeaveRequest(values: LeaveRequestFormValues): Promise<LeaveRequest> {
  return api('/leave-requests', { method: 'POST', body: JSON.stringify(values) });
}

export interface LeaveDecisionInput {
  id: string;
  action: LeaveDecisionAction;
  rejectReason?: string;
}

export function decideLeaveRequest({ id, ...body }: LeaveDecisionInput): Promise<LeaveRequest> {
  return api(`/leave-requests/${id}/decision`, { method: 'PATCH', body: JSON.stringify(body) });
}
