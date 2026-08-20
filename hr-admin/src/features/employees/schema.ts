import { z } from 'zod';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 클라이언트(react-hook-form)와 mock 서버(핸들러) 양쪽에서 같은 스키마를 사용한다
export const employeeFormSchema = z
  .object({
    name: z.string().trim().min(1, '이름을 입력하세요'),
    email: z.email('올바른 이메일 형식이 아닙니다'),
    department: z.enum(DEPARTMENTS, '부서를 선택하세요'),
    position: z.string().trim().min(1, '직급을 입력하세요'),
    status: z.enum(EMPLOYEE_STATUSES, '상태를 선택하세요'),
    hiredAt: z.string().regex(DATE_PATTERN, '입사일을 입력하세요'),
    resignedAt: z
      .union([
        z.string().regex(DATE_PATTERN, '퇴사일 형식이 올바르지 않습니다'),
        z.literal(''),
        z.null(),
      ])
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status !== 'resigned') return;
    if (!v.resignedAt) {
      ctx.addIssue({ code: 'custom', path: ['resignedAt'], message: '퇴사일을 입력하세요' });
    } else if (v.resignedAt < v.hiredAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['resignedAt'],
        message: '퇴사일은 입사일 이후여야 합니다',
      });
    }
  })
  .transform((v) => ({
    ...v,
    // 퇴사 상태가 아니면 남아있는 퇴사일 값을 버린다
    resignedAt: v.status === 'resigned' && v.resignedAt ? v.resignedAt : null,
  }));

/** 폼 입력값 타입 (transform 이전) */
export type EmployeeFormInput = z.input<typeof employeeFormSchema>;
/** 검증·정규화가 끝난 값 타입 (API로 보내는 형태) */
export type EmployeeFormValues = z.output<typeof employeeFormSchema>;
