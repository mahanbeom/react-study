import type { Role } from './types';

export type PermissionAction = 'employee.write' | 'leave.decide' | 'leave.request';

// 화면(버튼 노출/라우트 가드)과 mock 서버(403)가 같은 매트릭스를 공유한다
const PERMISSIONS: Record<Role, ReadonlySet<PermissionAction>> = {
  admin: new Set<PermissionAction>(['employee.write', 'leave.decide', 'leave.request']),
  member: new Set<PermissionAction>(['leave.request']),
};

export function can(role: Role, action: PermissionAction): boolean {
  return PERMISSIONS[role].has(action);
}
