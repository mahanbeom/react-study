import { api } from '@/lib/api';
import type { Department } from './types';

export function fetchDepartments(): Promise<Department[]> {
  return api('/departments');
}
