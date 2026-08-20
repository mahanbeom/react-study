import type { LeaveRequest } from './types';

export type LeaveDecisionAction = 'approve' | 'reject';

export interface LeaveDecision {
  action: LeaveDecisionAction;
  rejectReason?: string;
  /** YYYY-MM-DD — 순수성을 위해 호출부(핸들러)가 주입한다 */
  decidedAt: string;
}

export type DecideResult =
  | { ok: true; request: LeaveRequest }
  | { ok: false; error: 'ALREADY_DECIDED' | 'REJECT_REASON_REQUIRED' };

/**
 * 휴가 신청 상태 전이 규칙.
 * pending → approved | rejected 만 허용하며, 승인/반려는 종결 상태다.
 */
export function decide(request: LeaveRequest, decision: LeaveDecision): DecideResult {
  if (request.status !== 'pending') {
    return { ok: false, error: 'ALREADY_DECIDED' };
  }

  if (decision.action === 'reject') {
    const reason = decision.rejectReason?.trim();
    if (!reason) return { ok: false, error: 'REJECT_REASON_REQUIRED' };
    return {
      ok: true,
      request: {
        ...request,
        status: 'rejected',
        decidedAt: decision.decidedAt,
        rejectReason: reason,
      },
    };
  }

  return {
    ok: true,
    request: { ...request, status: 'approved', decidedAt: decision.decidedAt, rejectReason: null },
  };
}
