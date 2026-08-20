import { api } from '@/lib/api';
import type { EmployeeFormValues } from './schema';
import type { Employee, EmployeeListParams, Paginated } from './types';

export function fetchEmployees(params: EmployeeListParams = {}): Promise<Paginated<Employee>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.search) qs.set('search', params.search);
  if (params.department) qs.set('department', params.department);
  if (params.status) qs.set('status', params.status);
  const query = qs.toString();
  return api(`/employees${query ? `?${query}` : ''}`);
}

export function fetchEmployee(id: string): Promise<Employee> {
  return api(`/employees/${id}`);
}

export function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  return api('/employees', { method: 'POST', body: JSON.stringify(values) });
}

export function updateEmployee(id: string, values: EmployeeFormValues): Promise<Employee> {
  return api(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}

export function deleteEmployee(id: string): Promise<void> {
  return api(`/employees/${id}`, { method: 'DELETE' });
}
