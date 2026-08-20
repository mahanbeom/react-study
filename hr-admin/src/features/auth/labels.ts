import type { BadgeVariant } from '@/ui';
import type { Role } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: '관리자',
  member: '일반',
};

export const ROLE_BADGE_VARIANTS: Record<Role, BadgeVariant> = {
  admin: 'info',
  member: 'neutral',
};
