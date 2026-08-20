import type { Employee } from '../features/employees/types';

export interface Headcount {
  total: number;
  active: number;
  onLeave: number;
  resigned: number;
}

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  hires: number;
  resignations: number;
}

export function countHeadcount(employees: Employee[]): Headcount {
  const counts = { total: employees.length, active: 0, onLeave: 0, resigned: 0 };
  for (const e of employees) counts[e.status] += 1;
  return counts;
}

/** endMonth(YYYY-MM)를 마지막 버킷으로 months개월 치 입퇴사 추이를 만든다 */
export function buildMonthlyTrend(
  employees: Employee[],
  endMonth: string,
  months: number,
): MonthlyTrendPoint[] {
  const [endYear, endMon] = endMonth.split('-').map(Number) as [number, number];

  const buckets = new Map<string, MonthlyTrendPoint>();
  for (let i = months - 1; i >= 0; i--) {
    // Date의 month 오버플로 정규화로 연도 경계를 처리한다
    const d = new Date(Date.UTC(endYear, endMon - 1 - i, 1));
    const month = d.toISOString().slice(0, 7);
    buckets.set(month, { month, hires: 0, resignations: 0 });
  }

  for (const e of employees) {
    const hiredMonth = e.hiredAt.slice(0, 7);
    const hiredBucket = buckets.get(hiredMonth);
    if (hiredBucket) hiredBucket.hires += 1;

    if (e.resignedAt) {
      const resignedBucket = buckets.get(e.resignedAt.slice(0, 7));
      if (resignedBucket) resignedBucket.resignations += 1;
    }
  }

  return [...buckets.values()];
}
