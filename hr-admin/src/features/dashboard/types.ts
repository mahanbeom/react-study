export interface DashboardSummary {
  headcount: { total: number; active: number; onLeave: number; resigned: number };
  /** 최근 12개월, 과거→현재 순 */
  monthlyTrend: { month: string; hires: number; resignations: number }[];
}
