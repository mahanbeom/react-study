import type { BadgeVariant } from '@/ui';
import type { EmployeeStatus } from './types';

// 부서 이름은 정적 매핑이 아니라 Department 엔티티(GET /api/departments)에서 온다

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
