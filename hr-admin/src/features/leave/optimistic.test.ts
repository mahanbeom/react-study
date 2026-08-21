import { describe, expect, it } from 'vitest';
import type { Paginated } from '@/features/employees/types';
import { applyDecisionToList } from './optimistic';
import type { LeaveRequest } from './types';

function makeRequest(overrides: Partial<LeaveRequest> & Pick<LeaveRequest, 'id'>): LeaveRequest {
  return {
    employeeId: 'e1',
    employeeName: '김민준',
    type: 'annual',
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    reason: '가족 여행',
    status: 'pending',
    createdAt: '2026-08-20',
    decidedAt: null,
    rejectReason: null,
    ...overrides,
  };
}

function makePage(items: LeaveRequest[]): Paginated<LeaveRequest> {
  return { items, total: 18, page: 1, pageSize: 10 };
}

describe('applyDecisionToList', () => {
  it('approve면 해당 id의 status만 approved로 바뀌고 다른 항목과 total은 그대로다', () => {
    const page = makePage([makeRequest({ id: '1' }), makeRequest({ id: '2' })]);

    const result = applyDecisionToList(page, { id: '1', action: 'approve' });

    expect(result.items[0]).toMatchObject({ id: '1', status: 'approved', rejectReason: null });
    expect(result.items[1]).toEqual(page.items[1]);
    expect(result.total).toBe(18);
    // 원본은 변경하지 않는다 (불변 업데이트)
    expect(page.items[0]!.status).toBe('pending');
  });

  it('reject면 rejectReason이 트림되어 설정된다', () => {
    const page = makePage([makeRequest({ id: '1' })]);

    const result = applyDecisionToList(page, {
      id: '1',
      action: 'reject',
      rejectReason: '  업무 일정과 겹칩니다  ',
    });

    expect(result.items[0]).toMatchObject({
      status: 'rejected',
      rejectReason: '업무 일정과 겹칩니다',
    });
  });

  it('pending이 아닌 항목과 존재하지 않는 id는 건드리지 않는다', () => {
    const decided = makeRequest({ id: '1', status: 'approved', decidedAt: '2026-08-21' });
    const page = makePage([decided]);

    // 이미 처리된 항목에 대한 결정 — 상태 전이 규칙상 무시된다
    expect(applyDecisionToList(page, { id: '1', action: 'reject' }).items[0]).toEqual(decided);
    // 없는 id — 아무 것도 바뀌지 않는다
    expect(applyDecisionToList(page, { id: '99', action: 'approve' }).items).toEqual(page.items);
  });
});
