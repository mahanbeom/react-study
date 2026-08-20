import { delay, http, HttpResponse } from 'msw';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../features/employees/types';
import { EMPLOYEES } from './db';
import { queryEmployees } from './employees';

function pickParam<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export const handlers = [
  http.get('/api/employees', async ({ request }) => {
    const url = new URL(request.url);
    await delay(300); // 네트워크 지연 시뮬레이션 — 로딩 상태를 눈으로 확인할 수 있게

    return HttpResponse.json(
      queryEmployees(EMPLOYEES, {
        page: Number(url.searchParams.get('page')) || undefined,
        pageSize: Number(url.searchParams.get('pageSize')) || undefined,
        search: url.searchParams.get('search') ?? undefined,
        department: pickParam(url.searchParams.get('department'), DEPARTMENTS),
        status: pickParam(url.searchParams.get('status'), EMPLOYEE_STATUSES),
      }),
    );
  }),
];
