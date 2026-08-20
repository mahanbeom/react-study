import { queryOptions } from '@tanstack/react-query';
import { fetchDashboardSummary } from './api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

export function dashboardSummaryQuery() {
  return queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboardSummary,
  });
}
