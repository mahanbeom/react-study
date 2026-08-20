import type { LeaveRequestFormValues } from '../features/leave/schema';
import type { LeaveRequest } from '../features/leave/types';
import { LEAVE_TYPES } from '../features/leave/types';
import { listEmployees, mulberry32 } from './db';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_BASE = Date.UTC(2026, 7, 20); // 시드 기준일 — 결정적 데이터를 위해 고정

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const REASONS = [
  '가족 여행',
  '개인 사정',
  '병원 진료',
  '컨디션 난조로 휴식이 필요합니다',
  '경조사 참석',
  '이사 준비',
];

function generateLeaveRequests(count: number): LeaveRequest[] {
  const random = mulberry32(20260821);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)]!;
  const activeEmployees = listEmployees().filter((e) => e.status !== 'resigned');

  return Array.from({ length: count }, (_, i) => {
    const employee = pick(activeEmployees);
    const type = pick(LEAVE_TYPES);
    const createdMs = SEED_BASE - Math.floor(random() * 60) * DAY_MS;
    const startMs = createdMs + (3 + Math.floor(random() * 20)) * DAY_MS;
    const durationDays = type === 'half' ? 0 : Math.floor(random() * 4);

    const roll = random();
    let status: LeaveRequest['status'] = 'pending';
    let decidedAt: string | null = null;
    let rejectReason: string | null = null;
    if (roll < 0.4) {
      status = 'approved';
      decidedAt = toIsoDate(createdMs + (1 + Math.floor(random() * 3)) * DAY_MS);
    } else if (roll < 0.6) {
      status = 'rejected';
      decidedAt = toIsoDate(createdMs + (1 + Math.floor(random() * 3)) * DAY_MS);
      rejectReason = '해당 기간 업무 일정과 겹칩니다';
    }

    return {
      id: String(i + 1),
      employeeId: employee.id,
      employeeName: employee.name,
      type,
      startDate: toIsoDate(startMs),
      endDate: toIsoDate(startMs + durationDays * DAY_MS),
      reason: pick(REASONS),
      status,
      createdAt: toIsoDate(createdMs),
      decidedAt,
      rejectReason,
    };
  });
}

// 인메모리 저장소 — 변경 사항은 새로고침 전까지 유지된다
let leaveRequests = generateLeaveRequests(18);
let nextId = leaveRequests.length + 1;

export function listLeaveRequests(): LeaveRequest[] {
  return leaveRequests;
}

export function findLeaveRequest(id: string): LeaveRequest | undefined {
  return leaveRequests.find((r) => r.id === id);
}

export function insertLeaveRequest(
  values: LeaveRequestFormValues,
  employeeName: string,
  createdAt: string,
): LeaveRequest {
  const request: LeaveRequest = {
    id: String(nextId++),
    ...values,
    employeeName,
    status: 'pending',
    createdAt,
    decidedAt: null,
    rejectReason: null,
  };
  leaveRequests = [request, ...leaveRequests];
  return request;
}

export function replaceLeaveRequest(updated: LeaveRequest): void {
  leaveRequests = leaveRequests.map((r) => (r.id === updated.id ? updated : r));
}
