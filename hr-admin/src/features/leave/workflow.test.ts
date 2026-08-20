import { describe, expect, it } from 'vitest';
import type { LeaveRequest } from './types';
import { decide } from './workflow';

function request(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id: '1',
    employeeId: '10',
    employeeName: '김민수',
    type: 'annual',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    reason: '가족 여행',
    status: 'pending',
    createdAt: '2026-08-10',
    decidedAt: null,
    rejectReason: null,
    ...overrides,
  };
}

const DECIDED_AT = '2026-08-20';

describe('decide — 휴가 상태 전이', () => {
  it('대기 → 승인', () => {
    const result = decide(request(), { action: 'approve', decidedAt: DECIDED_AT });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.status).toBe('approved');
    expect(result.request.decidedAt).toBe(DECIDED_AT);
    expect(result.request.rejectReason).toBeNull();
  });

  it('대기 → 반려 (사유 기록)', () => {
    const result = decide(request(), {
      action: 'reject',
      rejectReason: '일정 조율 필요',
      decidedAt: DECIDED_AT,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.status).toBe('rejected');
    expect(result.request.decidedAt).toBe(DECIDED_AT);
    expect(result.request.rejectReason).toBe('일정 조율 필요');
  });

  it('반려에는 사유가 필수다', () => {
    const result = decide(request(), { action: 'reject', decidedAt: DECIDED_AT });
    expect(result).toEqual({ ok: false, error: 'REJECT_REASON_REQUIRED' });
  });

  it('사유가 공백뿐이면 반려할 수 없다', () => {
    const result = decide(request(), {
      action: 'reject',
      rejectReason: '   ',
      decidedAt: DECIDED_AT,
    });
    expect(result).toEqual({ ok: false, error: 'REJECT_REASON_REQUIRED' });
  });

  it('이미 승인된 신청은 다시 처리할 수 없다 (종결 상태)', () => {
    const approved = request({ status: 'approved', decidedAt: '2026-08-15' });
    expect(decide(approved, { action: 'approve', decidedAt: DECIDED_AT })).toEqual({
      ok: false,
      error: 'ALREADY_DECIDED',
    });
    expect(
      decide(approved, { action: 'reject', rejectReason: '사유', decidedAt: DECIDED_AT }),
    ).toEqual({ ok: false, error: 'ALREADY_DECIDED' });
  });

  it('이미 반려된 신청도 다시 처리할 수 없다', () => {
    const rejected = request({
      status: 'rejected',
      decidedAt: '2026-08-15',
      rejectReason: '기존 사유',
    });
    expect(decide(rejected, { action: 'approve', decidedAt: DECIDED_AT })).toEqual({
      ok: false,
      error: 'ALREADY_DECIDED',
    });
  });

  it('원본 객체를 변경하지 않는다', () => {
    const original = request();
    decide(original, { action: 'approve', decidedAt: DECIDED_AT });
    expect(original.status).toBe('pending');
    expect(original.decidedAt).toBeNull();
  });
});
