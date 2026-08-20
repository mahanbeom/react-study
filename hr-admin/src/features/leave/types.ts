export const LEAVE_TYPES = ['annual', 'half', 'sick'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface LeaveRequest {
  id: string;
  employeeId: string;
  /** 목록 표시용 비정규화 필드 */
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  decidedAt: string | null;
  /** 반려 시 필수 */
  rejectReason: string | null;
}

export interface LeaveListParams {
  page?: number;
  pageSize?: number;
  status?: LeaveStatus;
}
