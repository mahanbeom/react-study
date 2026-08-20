import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { employeeListQuery } from '@/features/employees/queries';
import { useCreateLeaveRequest } from '@/features/leave/mutations';
import { LEAVE_TYPE_LABELS } from '@/features/leave/labels';
import {
  leaveRequestFormSchema,
  type LeaveRequestFormInput,
  type LeaveRequestFormValues,
} from '@/features/leave/schema';
import { LEAVE_TYPES } from '@/features/leave/types';
import { Button, FormField, Input, Select, Textarea } from '@/ui';

const BLANK: LeaveRequestFormInput = {
  employeeId: '',
  type: 'annual',
  startDate: '',
  endDate: '',
  reason: '',
};

export function LeaveCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateLeaveRequest();
  // 재직 중인 직원만 신청 대상으로 노출한다
  const employeesQuery = useQuery(employeeListQuery({ status: 'active', pageSize: 100 }));

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestFormInput, unknown, LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: BLANK,
  });

  async function submit(values: LeaveRequestFormValues) {
    try {
      await createMutation.mutateAsync(values);
      void navigate('/leave?status=pending');
    } catch {
      setError('root', {
        type: 'server',
        message: '신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">휴가 신청</h2>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="직원" required error={errors.employeeId?.message}>
              <Controller
                control={control}
                name="employeeId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    allLabel={employeesQuery.isPending ? '불러오는 중…' : '선택하세요'}
                    options={(employeesQuery.data?.items ?? []).map((e) => ({
                      value: e.id,
                      label: `${e.name} (${e.position})`,
                    }))}
                  />
                )}
              />
            </FormField>
            <FormField label="유형" required error={errors.type?.message}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={LEAVE_TYPES.map((t) => ({ value: t, label: LEAVE_TYPE_LABELS[t] }))}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="시작일"
              htmlFor="startDate"
              required
              error={errors.startDate?.message}
            >
              <Input id="startDate" type="date" {...register('startDate')} />
            </FormField>
            <FormField label="종료일" htmlFor="endDate" required error={errors.endDate?.message}>
              <Input id="endDate" type="date" {...register('endDate')} />
            </FormField>
          </div>

          <FormField label="사유" htmlFor="reason" required error={errors.reason?.message}>
            <Textarea id="reason" {...register('reason')} placeholder="휴가 사유를 입력하세요" />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => void navigate('/leave')}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" loading={isSubmitting}>
              신청
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
