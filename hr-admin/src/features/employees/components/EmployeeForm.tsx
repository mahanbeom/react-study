import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api';
import { Button, FormField, Input, Select } from '@/ui';
import { DEPARTMENT_LABELS, STATUS_LABELS } from '../labels';
import { employeeFormSchema, type EmployeeFormInput, type EmployeeFormValues } from '../schema';
import { DEPARTMENTS, EMPLOYEE_STATUSES, type DepartmentId } from '../types';

const BLANK: EmployeeFormInput = {
  name: '',
  email: '',
  // 빈 값으로 시작해 "선택하세요"를 강제한다 — 제출 시 zod enum 검증에 걸린다
  department: '' as DepartmentId,
  position: '',
  status: 'active',
  hiredAt: '',
  resignedAt: '',
};

interface EmployeeFormProps {
  defaultValues?: EmployeeFormInput;
  submitLabel: string;
  /** ApiError를 throw하면 폼이 서버 에러로 표시한다 */
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormInput, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultValues ?? BLANK,
  });

  const status = watch('status');

  async function submit(values: EmployeeFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { type: 'server', message: '이미 사용 중인 이메일입니다' });
      } else {
        setError('root', {
          type: 'server',
          message: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {errors.root && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
      )}

      <FormField label="이름" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" {...register('name')} placeholder="홍길동" />
      </FormField>

      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" {...register('email')} placeholder="user@hrcorp.dev" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="부서" required error={errors.department?.message}>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                allLabel="선택하세요"
                options={DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }))}
              />
            )}
          />
        </FormField>
        <FormField label="직급" htmlFor="position" required error={errors.position?.message}>
          <Input id="position" {...register('position')} placeholder="대리" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="상태" required error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={EMPLOYEE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            )}
          />
        </FormField>
        <FormField label="입사일" htmlFor="hiredAt" required error={errors.hiredAt?.message}>
          <Input id="hiredAt" type="date" {...register('hiredAt')} />
        </FormField>
      </div>

      <FormField
        label="퇴사일"
        htmlFor="resignedAt"
        required={status === 'resigned'}
        error={errors.resignedAt?.message}
      >
        <Input
          id="resignedAt"
          type="date"
          disabled={status !== 'resigned'}
          {...register('resignedAt')}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
