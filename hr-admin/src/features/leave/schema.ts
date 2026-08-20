import { z } from 'zod';
import { LEAVE_TYPES } from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 클라이언트 폼과 mock 서버 양쪽에서 사용한다 (employees/schema.ts 패턴)
export const leaveRequestFormSchema = z
  .object({
    employeeId: z.string().min(1, '직원을 선택하세요'),
    type: z.enum(LEAVE_TYPES, '휴가 유형을 선택하세요'),
    startDate: z.string().regex(DATE_PATTERN, '시작일을 입력하세요'),
    endDate: z.string().regex(DATE_PATTERN, '종료일을 입력하세요'),
    reason: z.string().trim().min(1, '사유를 입력하세요'),
  })
  .superRefine((v, ctx) => {
    if (v.endDate < v.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: '종료일은 시작일 이후여야 합니다',
      });
    }
  });

export type LeaveRequestFormInput = z.input<typeof leaveRequestFormSchema>;
export type LeaveRequestFormValues = z.output<typeof leaveRequestFormSchema>;
