export const ROLES = ['admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
