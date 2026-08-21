import type { Department } from '../departments/types';

export const ROLES = ['admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

/** 저장되는 계정 — 인사 정보(부서 등)는 여기 두지 않고 직원(Employee)과의 관계로만 연결한다 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** 연결된 직원 id — admin처럼 직원이 아닌 계정은 null */
  employeeId: string | null;
}

/**
 * 로그인/me 응답 DTO — 원본은 관계 한 곳(계정→직원→부서)에만 두고,
 * 화면에서 자주 쓰는 값은 서버가 응답 시점에 파생해 내려준다.
 */
export interface AuthProfile extends AuthUser {
  /** 나를 부서장으로 가리키는 부서가 있는가 (role이 아니라 관계에서 파생) */
  isManager: boolean;
  /** 연결된 직원의 소속 부서 — 직원이 없으면 null */
  department: Department | null;
}
