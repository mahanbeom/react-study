import { describe, expect, it } from 'vitest';
import type { Employee } from '../features/employees/types';
import { buildMonthlyTrend, countHeadcount } from './dashboard';

function emp(overrides: Partial<Employee> & Pick<Employee, 'id'>): Employee {
  return {
    name: '직원' + overrides.id,
    email: `emp${overrides.id}@example.com`,
    department: 'engineering',
    position: '사원',
    status: 'active',
    hiredAt: '2024-01-01',
    resignedAt: null,
    ...overrides,
  };
}

describe('countHeadcount', () => {
  it('상태별 인원과 전체를 집계한다', () => {
    const employees = [
      emp({ id: '1' }),
      emp({ id: '2' }),
      emp({ id: '3', status: 'onLeave' }),
      emp({ id: '4', status: 'resigned', resignedAt: '2025-01-31' }),
    ];
    expect(countHeadcount(employees)).toEqual({ total: 4, active: 2, onLeave: 1, resigned: 1 });
  });

  it('빈 목록은 전부 0이다', () => {
    expect(countHeadcount([])).toEqual({ total: 0, active: 0, onLeave: 0, resigned: 0 });
  });
});

describe('buildMonthlyTrend', () => {
  it('요청한 개월 수만큼 과거→현재 순으로 버킷을 만든다', () => {
    const trend = buildMonthlyTrend([], '2026-08', 3);
    expect(trend.map((t) => t.month)).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('연도 경계를 넘어 버킷을 만든다', () => {
    const trend = buildMonthlyTrend([], '2026-01', 3);
    expect(trend.map((t) => t.month)).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('입사와 퇴사를 해당 월 버킷에 집계한다', () => {
    const employees = [
      emp({ id: '1', hiredAt: '2026-07-05' }),
      emp({ id: '2', hiredAt: '2026-07-28' }),
      emp({ id: '3', hiredAt: '2026-06-10', status: 'resigned', resignedAt: '2026-08-01' }),
    ];
    const trend = buildMonthlyTrend(employees, '2026-08', 3);
    expect(trend).toEqual([
      { month: '2026-06', hires: 1, resignations: 0 },
      { month: '2026-07', hires: 2, resignations: 0 },
      { month: '2026-08', hires: 0, resignations: 1 },
    ]);
  });

  it('윈도우 밖의 이벤트는 무시한다', () => {
    const employees = [
      emp({ id: '1', hiredAt: '2026-05-31' }),
      emp({ id: '2', hiredAt: '2026-09-01' }),
    ];
    const trend = buildMonthlyTrend(employees, '2026-08', 3);
    expect(trend.every((t) => t.hires === 0 && t.resignations === 0)).toBe(true);
  });

  it('이벤트가 없는 달은 0으로 채운다', () => {
    const employees = [emp({ id: '1', hiredAt: '2026-08-15' })];
    const trend = buildMonthlyTrend(employees, '2026-08', 12);
    expect(trend).toHaveLength(12);
    expect(trend.at(-1)).toEqual({ month: '2026-08', hires: 1, resignations: 0 });
    expect(trend.slice(0, 11).every((t) => t.hires === 0 && t.resignations === 0)).toBe(true);
  });
});
