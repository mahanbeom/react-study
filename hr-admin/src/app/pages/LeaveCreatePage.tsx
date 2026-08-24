import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { employeeListQuery } from '@/features/employees/queries';
import { exceedsRemaining } from '@/features/leave/balance';
import { useCreateLeaveRequest } from '@/features/leave/mutations';
import { LEAVE_TYPE_LABELS } from '@/features/leave/labels';
import {
  leaveRequestFormSchema,
  type LeaveRequestFormInput,
  type LeaveRequestFormValues,
} from '@/features/leave/schema';
import { leaveBalanceQuery } from '@/features/leave/queries';
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestFormInput, unknown, LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: BLANK,
  });

  const [employeeId, startDate] = watch(['employeeId', 'startDate']);
  // 연차는 연 단위로 부여되므로 시작일이 정해지면 그 연도의 잔여를 본다
  const year = /^\d{4}-/.test(startDate)
    ? Number(startDate.slice(0, 4))
    : new Date().getUTCFullYear();
  const balanceQuery = useQuery({
    ...leaveBalanceQuery(employeeId, year),
    enabled: employeeId !== '',
  });
  const balance = balanceQuery.data;

  async function submit(values: LeaveRequestFormValues) {
    // 서버와 같은 판정 함수로 미리 막는다 (잔여를 못 받았으면 서버 400이 안전망)
    if (balance && exceedsRemaining(balance, values)) {
      setError('endDate', {
        type: 'validate',
        message: `잔여 연차(${balance.remaining}일)를 초과합니다`,
      });
      return;
    }
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

          {balance && (
            <p className="text-xs text-slate-500">
              잔여 연차 {balance.remaining}일 · 사용 {balance.used}일 · 대기 {balance.reserved}일 (
              {balance.year}년)
            </p>
          )}

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
