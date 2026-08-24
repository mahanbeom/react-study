import type { LeaveRequest } from './types';

/** 전 직원 공통 연간 부여일수 — 직원별 차등·이월 정책은 범위 밖 */
export const ANNUAL_GRANTED_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 잔여는 저장하지 않고 휴가 신청 목록에서 파생한다.
 * reserved(대기중 예약분)를 함께 빼기 때문에, 승인 전이라도 중복 신청으로
 * 잔여가 음수가 되지 않는다. 반려되면 예약분이 사라져 잔여가 자동 복귀한다.
 */
export interface LeaveBalance {
  year: number;
  granted: number;
  /** 승인(approved)된 신청의 차감 합 */
  used: number;
  /** 대기(pending)중인 신청의 예약 합 */
  reserved: number;
  /** granted - used - reserved (파생) */
  remaining: number;
}

/** 차감 계산에 필요한 최소 정보 — 저장된 신청과 아직 만들어지지 않은 신청 모두에 쓴다 */
type LeaveSpan = Pick<LeaveRequest, 'type' | 'startDate' | 'endDate'>;

/** 달력일수(양끝 포함). 'YYYY-MM-DD'는 Date.parse가 UTC로 해석하므로 타임존에 안전하다 */
export function calendarDaysInclusive(startDate: string, endDate: string): number {
  return (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS + 1;
}

/** 유형별 연차 차감량 — 연차는 달력일수, 반차는 0.5일, 병가는 차감 없음 */
export function leaveDeduction({ type, startDate, endDate }: LeaveSpan): number {
  if (type === 'sick') return 0;
  if (type === 'half') return 0.5;
  return calendarDaysInclusive(startDate, endDate);
}

/** 신청 목록에서 특정 직원·연도의 잔여를 파생 계산한다 (연도 귀속은 시작일 기준) */
export function computeLeaveBalance(
  requests: LeaveRequest[],
  employeeId: string,
  year: number,
): LeaveBalance {
  const prefix = `${year}-`;
  let used = 0;
  let reserved = 0;

  for (const request of requests) {
    if (request.employeeId !== employeeId) continue;
    if (!request.startDate.startsWith(prefix)) continue;
    // 반려된 신청은 집계하지 않는다 — 예약분이 사라지는 것이 곧 "복원"이다
    if (request.status === 'approved') used += leaveDeduction(request);
    else if (request.status === 'pending') reserved += leaveDeduction(request);
  }

  return {
    year,
    granted: ANNUAL_GRANTED_DAYS,
    used,
    reserved,
    remaining: ANNUAL_GRANTED_DAYS - used - reserved,
  };
}

/**
 * 새 신청이 잔여를 초과하는지 판정한다.
 * 클라이언트(제출 전 검증)와 mock 서버(POST 400)가 같은 함수를 공유한다.
 * 클라이언트는 목록 전체를 갖고 있지 않으므로 계산 결과인 LeaveBalance를 받는다.
 */
export function exceedsRemaining(balance: LeaveBalance, candidate: LeaveSpan): boolean {
  return leaveDeduction(candidate) > balance.remaining;
}
