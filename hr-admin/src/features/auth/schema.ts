import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
