import { createBrowserRouter } from 'react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { LeavePage } from './pages/LeavePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AdminLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'employees', Component: EmployeeListPage },
      { path: 'employees/new', Component: EmployeeCreatePage },
      { path: 'employees/:employeeId', Component: EmployeeDetailPage },
      { path: 'leave', Component: LeavePage },
    ],
  },
  { path: '/login', Component: LoginPage },
  { path: '*', Component: NotFoundPage },
]);
