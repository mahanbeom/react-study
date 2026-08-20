import type { BadgeVariant } from '@/ui';
import type { Department, EmployeeStatus } from './types';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  engineering: '개발',
  design: '디자인',
  product: '기획',
  hr: '인사',
  finance: '재무',
  sales: '영업',
};

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: '재직',
  onLeave: '휴직',
  resigned: '퇴사',
};

export const STATUS_BADGE_VARIANTS: Record<EmployeeStatus, BadgeVariant> = {
  active: 'success',
  onLeave: 'warning',
  resigned: 'neutral',
};
