import { delay, http, HttpResponse } from 'msw';
import { employeeFormSchema } from '../features/employees/schema';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../features/employees/types';
import {
  findEmployee,
  insertEmployee,
  isEmailTaken,
  listEmployees,
  removeEmployee,
  updateEmployeeRecord,
} from './db';
import { buildMonthlyTrend, countHeadcount } from './dashboard';
import { queryEmployees } from './employees';

function pickParam<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export const handlers = [
  http.get('/api/dashboard/summary', async () => {
    await delay(300);
    const employees = listEmployees();
    const currentMonth = new Date().toISOString().slice(0, 7);
    return HttpResponse.json({
      headcount: countHeadcount(employees),
      monthlyTrend: buildMonthlyTrend(employees, currentMonth, 12),
    });
  }),

  http.get('/api/employees', async ({ request }) => {
    const url = new URL(request.url);
    await delay(300); // 네트워크 지연 시뮬레이션 — 로딩 상태를 눈으로 확인할 수 있게

    return HttpResponse.json(
      queryEmployees(listEmployees(), {
        page: Number(url.searchParams.get('page')) || undefined,
        pageSize: Number(url.searchParams.get('pageSize')) || undefined,
        search: url.searchParams.get('search') ?? undefined,
        department: pickParam(url.searchParams.get('department'), DEPARTMENTS),
        status: pickParam(url.searchParams.get('status'), EMPLOYEE_STATUSES),
      }),
    );
  }),

  http.get('/api/employees/:id', async ({ params }) => {
    await delay(200);
    const employee = findEmployee(params.id as string);
    if (!employee) {
      return HttpResponse.json({ message: '직원을 찾을 수 없습니다' }, { status: 404 });
    }
    return HttpResponse.json(employee);
  }),

  http.post('/api/employees', async ({ request }) => {
    await delay(300);
    // 실제 백엔드처럼 서버에서도 같은 스키마로 검증한다
    const parsed = employeeFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    if (isEmailTaken(parsed.data.email)) {
      return HttpResponse.json({ message: '이미 사용 중인 이메일입니다' }, { status: 409 });
    }
    return HttpResponse.json(insertEmployee(parsed.data), { status: 201 });
  }),

  http.put('/api/employees/:id', async ({ params, request }) => {
    await delay(300);
    const id = params.id as string;
    const parsed = employeeFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    if (isEmailTaken(parsed.data.email, id)) {
      return HttpResponse.json({ message: '이미 사용 중인 이메일입니다' }, { status: 409 });
    }
    const updated = updateEmployeeRecord(id, parsed.data);
    if (!updated) {
      return HttpResponse.json({ message: '직원을 찾을 수 없습니다' }, { status: 404 });
    }
    return HttpResponse.json(updated);
  }),

  http.delete('/api/employees/:id', async ({ params }) => {
    await delay(300);
    if (!removeEmployee(params.id as string)) {
      return HttpResponse.json({ message: '직원을 찾을 수 없습니다' }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
