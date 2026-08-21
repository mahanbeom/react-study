import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { RequireRole } from '@/features/auth/components/RequireRole';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeeEditPage } from './pages/EmployeeEditPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { LeaveCreatePage } from './pages/LeaveCreatePage';
import { LeavePage } from './pages/LeavePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RequireEmployeeWrite() {
  return <RequireRole action="employee.write" />;
}

// 라우트 정의를 배열로 분리 — 테스트에서 createMemoryRouter로 같은 트리를 렌더하기 위함
export const routes: RouteObject[] = [
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: AdminLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'employees', Component: EmployeeListPage },
          { path: 'employees/:employeeId', Component: EmployeeDetailPage },
          { path: 'leave', Component: LeavePage },
          { path: 'leave/new', Component: LeaveCreatePage },
          {
            Component: RequireEmployeeWrite,
            children: [
              { path: 'employees/new', Component: EmployeeCreatePage },
              { path: 'employees/:employeeId/edit', Component: EmployeeEditPage },
            ],
          },
        ],
      },
    ],
  },
  { path: '/login', Component: LoginPage },
  { path: '*', Component: NotFoundPage },
];

export const router = createBrowserRouter(routes);
