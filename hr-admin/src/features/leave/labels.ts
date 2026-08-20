import type { BadgeVariant } from '@/ui';
import type { LeaveStatus, LeaveType } from './types';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: '연차',
  half: '반차',
  sick: '병가',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
};

export const LEAVE_STATUS_BADGE_VARIANTS: Record<LeaveStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};
