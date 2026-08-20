import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuthUser } from '@/features/auth/auth';
import { can } from '@/features/auth/permissions';
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from '@/features/employees/labels';
import { useDeleteEmployee } from '@/features/employees/mutations';
import { employeeDetailQuery } from '@/features/employees/queries';
import { ApiError } from '@/lib/api';
import { Badge, Button, ConfirmDialog, DescriptionList } from '@/ui';

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const query = useQuery(employeeDetailQuery(employeeId!));
  const deleteMutation = useDeleteEmployee();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user } = useAuthUser();
  const canWrite = user !== null && can(user.role, 'employee.write');

  if (query.isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        불러오는 중…
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500">
          {notFound ? '존재하지 않는 직원입니다.' : '직원 정보를 불러오지 못했습니다.'}
        </p>
        <Button variant="secondary" onClick={() => void navigate('/employees')}>
          목록으로
        </Button>
      </div>
    );
  }

  const employee = query.data;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{employee.name}</h2>
          <Badge variant={STATUS_BADGE_VARIANTS[employee.status]}>
            {STATUS_LABELS[employee.status]}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void navigate('/employees')}>
            목록
          </Button>
          {canWrite && (
            <>
              <Button
                variant="secondary"
                onClick={() => void navigate(`/employees/${employee.id}/edit`)}
              >
                수정
              </Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-6 py-2">
        <DescriptionList
          items={[
            { label: '이메일', value: employee.email },
            { label: '부서', value: DEPARTMENT_LABELS[employee.department] },
            { label: '직급', value: employee.position },
            { label: '입사일', value: employee.hiredAt },
            { label: '퇴사일', value: employee.resignedAt ?? '—' },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="직원 삭제"
        description={
          deleteMutation.isError
            ? '삭제에 실패했습니다. 다시 시도해주세요.'
            : `${employee.name} 님을 삭제할까요? 되돌릴 수 없습니다.`
        }
        confirmLabel="삭제"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(employee.id, { onSuccess: () => void navigate('/employees') })
        }
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
