import { http, HttpResponse } from 'msw';
import { networkDelay } from './latency';
import { can, type PermissionAction } from '../features/auth/permissions';
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
import { leaveRequestFormSchema } from '../features/leave/schema';
import { LEAVE_STATUSES } from '../features/leave/types';
import { decide, type LeaveDecisionAction } from '../features/leave/workflow';
import { buildMonthlyTrend, countHeadcount } from './dashboard';
import { queryEmployees } from './employees';
import { authenticate, issueToken, resolveAuthHeader } from './authDb';
import { listDepartments } from './departmentDb';
import { queryLeaveRequests } from './leave';
import {
  findLeaveRequest,
  insertLeaveRequest,
  listLeaveRequests,
  replaceLeaveRequest,
} from './leaveDb';

function pickParam<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** 쓰기 엔드포인트 인가 — 실패 시 401/403 응답을, 성공 시 null을 반환한다 */
function authorize(request: Request, action: PermissionAction): Response | null {
  const user = resolveAuthHeader(request.headers.get('Authorization'));
  if (!user) return HttpResponse.json({ message: '로그인이 필요합니다' }, { status: 401 });
  if (!can(user.role, action)) {
    return HttpResponse.json({ message: '권한이 없습니다' }, { status: 403 });
  }
  return null;
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await networkDelay(300);
    const body = (await request.json()) as { email?: string; password?: string };
    const user = authenticate(body.email ?? '', body.password ?? '');
    if (!user) {
      return HttpResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 },
      );
    }
    return HttpResponse.json({ token: issueToken(user.id), user });
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await networkDelay(150);
    const user = resolveAuthHeader(request.headers.get('Authorization'));
    if (!user) {
      return HttpResponse.json({ message: '인증이 유효하지 않습니다' }, { status: 401 });
    }
    return HttpResponse.json(user);
  }),

  http.get('/api/departments', async () => {
    await networkDelay(200);
    return HttpResponse.json(listDepartments());
  }),

  http.get('/api/dashboard/summary', async () => {
    await networkDelay(300);
    const employees = listEmployees();
    const currentMonth = new Date().toISOString().slice(0, 7);
    return HttpResponse.json({
      headcount: countHeadcount(employees),
      monthlyTrend: buildMonthlyTrend(employees, currentMonth, 12),
    });
  }),

  http.get('/api/employees', async ({ request }) => {
    const url = new URL(request.url);
    await networkDelay(300); // 네트워크 지연 시뮬레이션 — 로딩 상태를 눈으로 확인할 수 있게

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
    await networkDelay(200);
    const employee = findEmployee(params.id as string);
    if (!employee) {
      return HttpResponse.json({ message: '직원을 찾을 수 없습니다' }, { status: 404 });
    }
    return HttpResponse.json(employee);
  }),

  http.post('/api/employees', async ({ request }) => {
    await networkDelay(300);
    const denied = authorize(request, 'employee.write');
    if (denied) return denied;
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
    await networkDelay(300);
    const denied = authorize(request, 'employee.write');
    if (denied) return denied;
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

  http.get('/api/leave-requests', async ({ request }) => {
    const url = new URL(request.url);
    await networkDelay(300);
    return HttpResponse.json(
      queryLeaveRequests(listLeaveRequests(), {
        page: Number(url.searchParams.get('page')) || undefined,
        pageSize: Number(url.searchParams.get('pageSize')) || undefined,
        status: pickParam(url.searchParams.get('status'), LEAVE_STATUSES),
      }),
    );
  }),

  http.post('/api/leave-requests', async ({ request }) => {
    await networkDelay(300);
    const denied = authorize(request, 'leave.request');
    if (denied) return denied;
    const parsed = leaveRequestFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const employee = findEmployee(parsed.data.employeeId);
    if (!employee) {
      return HttpResponse.json({ message: '존재하지 않는 직원입니다' }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    return HttpResponse.json(insertLeaveRequest(parsed.data, employee.name, today), {
      status: 201,
    });
  }),

  http.patch('/api/leave-requests/:id/decision', async ({ params, request }) => {
    await networkDelay(300);
    const denied = authorize(request, 'leave.decide');
    if (denied) return denied;
    const body = (await request.json()) as { action?: string; rejectReason?: string };
    if (body.action !== 'approve' && body.action !== 'reject') {
      return HttpResponse.json({ message: '잘못된 요청입니다' }, { status: 400 });
    }

    const found = findLeaveRequest(params.id as string);
    if (!found) {
      return HttpResponse.json({ message: '휴가 신청을 찾을 수 없습니다' }, { status: 404 });
    }

    const result = decide(found, {
      action: body.action as LeaveDecisionAction,
      rejectReason: body.rejectReason,
      decidedAt: new Date().toISOString().slice(0, 10),
    });
    if (!result.ok) {
      // 상태 전이 위반: 이미 처리된 신청(409) / 반려 사유 누락(400)
      return result.error === 'ALREADY_DECIDED'
        ? HttpResponse.json({ message: '이미 처리된 신청입니다' }, { status: 409 })
        : HttpResponse.json({ message: '반려 사유를 입력하세요' }, { status: 400 });
    }
    replaceLeaveRequest(result.request);
    return HttpResponse.json(result.request);
  }),

  http.delete('/api/employees/:id', async ({ params, request }) => {
    await networkDelay(300);
    const denied = authorize(request, 'employee.write');
    if (denied) return denied;
    if (!removeEmployee(params.id as string)) {
      return HttpResponse.json({ message: '직원을 찾을 수 없습니다' }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
