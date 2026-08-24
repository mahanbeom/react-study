import { describe, expect, it } from 'vitest';
import {
  ANNUAL_GRANTED_DAYS,
  calendarDaysInclusive,
  computeLeaveBalance,
  exceedsRemaining,
  leaveDeduction,
} from './balance';
import type { LeaveRequest, LeaveType } from './types';

function makeRequest(
  overrides: Partial<LeaveRequest> & Pick<LeaveRequest, 'type' | 'startDate' | 'endDate' | 'status'>,
): LeaveRequest {
  return {
    id: 'r1',
    employeeId: '1',
    employeeName: '조우진',
    reason: '개인 사정',
    createdAt: '2026-08-01',
    decidedAt: null,
    rejectReason: null,
    ...overrides,
  };
}

describe('calendarDaysInclusive', () => {
  it('같은 날이면 1일이다', () => {
    expect(calendarDaysInclusive('2026-09-01', '2026-09-01')).toBe(1);
  });

  it('양끝을 포함해 센다', () => {
    expect(calendarDaysInclusive('2026-09-01', '2026-09-03')).toBe(3);
  });

  it('월 경계를 넘어도 정확하다', () => {
    expect(calendarDaysInclusive('2026-08-30', '2026-09-02')).toBe(4);
  });
});

describe('leaveDeduction', () => {
  it('연차는 달력일수만큼 차감한다', () => {
    expect(leaveDeduction({ type: 'annual', startDate: '2026-09-01', endDate: '2026-09-03' })).toBe(
      3,
    );
  });

  it('반차는 기간과 무관하게 0.5일이다', () => {
    expect(leaveDeduction({ type: 'half', startDate: '2026-09-01', endDate: '2026-09-01' })).toBe(
      0.5,
    );
  });

  it('병가는 연차를 차감하지 않는다', () => {
    expect(leaveDeduction({ type: 'sick', startDate: '2026-09-01', endDate: '2026-09-05' })).toBe(0);
  });
});

describe('computeLeaveBalance', () => {
  const REQUESTS: LeaveRequest[] = [
    // 승인 → used
    makeRequest({ id: '1', type: 'annual', startDate: '2026-03-02', endDate: '2026-03-03', status: 'approved' }),
    makeRequest({ id: '2', type: 'half', startDate: '2026-04-01', endDate: '2026-04-01', status: 'approved' }),
    // 대기 → reserved
    makeRequest({ id: '3', type: 'annual', startDate: '2026-05-04', endDate: '2026-05-04', status: 'pending' }),
    // 반려 → 무시
    makeRequest({ id: '4', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-05', status: 'rejected' }),
    // 병가 승인 → 차감 없음
    makeRequest({ id: '5', type: 'sick', startDate: '2026-07-01', endDate: '2026-07-03', status: 'approved' }),
    // 다른 직원 → 제외
    makeRequest({ id: '6', employeeId: '2', type: 'annual', startDate: '2026-03-10', endDate: '2026-03-14', status: 'approved' }),
    // 다른 연도 → 제외
    makeRequest({ id: '7', type: 'annual', startDate: '2025-03-02', endDate: '2025-03-06', status: 'approved' }),
  ];

  it('승인분은 used, 대기분은 reserved로 집계하고 잔여를 파생한다', () => {
    expect(computeLeaveBalance(REQUESTS, '1', 2026)).toEqual({
      year: 2026,
      granted: ANNUAL_GRANTED_DAYS,
      used: 2.5, // 연차 2일 + 반차 0.5일 (병가 제외)
      reserved: 1,
      remaining: ANNUAL_GRANTED_DAYS - 3.5,
    });
  });

  it('신청이 없는 직원은 부여일수가 그대로 잔여다', () => {
    expect(computeLeaveBalance(REQUESTS, '99', 2026)).toMatchObject({
      used: 0,
      reserved: 0,
      remaining: ANNUAL_GRANTED_DAYS,
    });
  });

  it('연도 귀속은 시작일 기준이다', () => {
    expect(computeLeaveBalance(REQUESTS, '1', 2025).used).toBe(5);
  });
});

describe('exceedsRemaining', () => {
  const balance = computeLeaveBalance([], '1', 2026); // remaining 15

  function candidate(type: LeaveType, startDate: string, endDate: string) {
    return { type, startDate, endDate };
  }

  it('잔여와 정확히 같은 일수는 초과가 아니다', () => {
    expect(exceedsRemaining(balance, candidate('annual', '2026-09-01', '2026-09-15'))).toBe(false);
  });

  it('잔여를 넘으면 초과다', () => {
    expect(exceedsRemaining(balance, candidate('annual', '2026-09-01', '2026-09-16'))).toBe(true);
  });

  it('0.5일만 넘어도 초과다', () => {
    const almostFull = { ...balance, used: 14.5, remaining: 0.5 };
    expect(exceedsRemaining(almostFull, candidate('annual', '2026-09-01', '2026-09-01'))).toBe(true);
    expect(exceedsRemaining(almostFull, candidate('half', '2026-09-01', '2026-09-01'))).toBe(false);
  });

  it('병가는 잔여가 0이어도 초과가 아니다', () => {
    const empty = { ...balance, used: 15, remaining: 0 };
    expect(exceedsRemaining(empty, candidate('sick', '2026-09-01', '2026-09-10'))).toBe(false);
  });
});
