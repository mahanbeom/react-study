import { describe, expect, it } from 'vitest';
import type { LeaveRequest } from '../features/leave/types';
import { queryLeaveRequests } from './leave';

function req(overrides: Partial<LeaveRequest> & Pick<LeaveRequest, 'id'>): LeaveRequest {
  return {
    employeeId: '1',
    employeeName: '직원' + overrides.id,
    type: 'annual',
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    reason: '사유',
    status: 'pending',
    createdAt: '2026-08-01',
    decidedAt: null,
    rejectReason: null,
    ...overrides,
  };
}

const DB: LeaveRequest[] = [
  req({ id: '1', createdAt: '2026-08-01' }),
  req({ id: '2', createdAt: '2026-08-10', status: 'approved', decidedAt: '2026-08-11' }),
  req({ id: '3', createdAt: '2026-08-05' }),
  req({
    id: '4',
    createdAt: '2026-08-12',
    status: 'rejected',
    decidedAt: '2026-08-13',
    rejectReason: '사유',
  }),
];

describe('queryLeaveRequests', () => {
  it('신청일 최신순으로 정렬한다', () => {
    const result = queryLeaveRequests(DB, {});
    expect(result.items.map((r) => r.id)).toEqual(['4', '2', '3', '1']);
    expect(result.total).toBe(4);
  });

  it('상태로 필터링한다', () => {
    const result = queryLeaveRequests(DB, { status: 'pending' });
    expect(result.items.map((r) => r.id)).toEqual(['3', '1']);
    expect(result.total).toBe(2);
  });

  it('필터 결과를 페이지네이션한다', () => {
    const result = queryLeaveRequests(DB, { page: 2, pageSize: 3 });
    expect(result.items.map((r) => r.id)).toEqual(['1']);
    expect(result.total).toBe(4);
    expect(result.page).toBe(2);
  });
});
