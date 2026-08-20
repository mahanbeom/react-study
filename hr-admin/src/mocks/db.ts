import type { Employee } from '../features/employees/types';
import { DEPARTMENTS } from '../features/employees/types';

// 시드 고정 의사난수(mulberry32) — 새로고침해도 항상 같은 데이터가 나와 재현 가능하다
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오'];
const FIRST_NAMES = [
  '민준',
  '서연',
  '도윤',
  '지우',
  '하은',
  '시우',
  '지호',
  '수아',
  '예준',
  '하윤',
  '지민',
  '서준',
  '민서',
  '채원',
  '건우',
  '유진',
  '현우',
  '다은',
  '우진',
  '소율',
];
const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장'];

const RANGE_START = Date.UTC(2022, 8, 1); // 2022-09-01
const RANGE_END = Date.UTC(2026, 7, 1); // 2026-08-01
const DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function generateEmployees(count: number): Employee[] {
  const random = mulberry32(20260820);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)]!;

  return Array.from({ length: count }, (_, i) => {
    const id = String(i + 1);
    const hiredMs = RANGE_START + random() * (RANGE_END - RANGE_START);
    const roll = random();

    let status: Employee['status'] = 'active';
    let resignedAt: string | null = null;
    if (roll < 0.15) {
      status = 'resigned';
      const resignedMs = Math.min(hiredMs + (60 + random() * 640) * DAY_MS, RANGE_END);
      resignedAt = toIsoDate(resignedMs);
    } else if (roll < 0.25) {
      status = 'onLeave';
    }

    return {
      id,
      name: `${pick(LAST_NAMES)}${pick(FIRST_NAMES)}`,
      email: `member${id.padStart(2, '0')}@hrcorp.dev`,
      department: pick(DEPARTMENTS),
      position: pick(POSITIONS),
      status,
      hiredAt: toIsoDate(hiredMs),
      resignedAt,
    };
  });
}

export const EMPLOYEES = generateEmployees(52);
