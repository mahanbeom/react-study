import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { EmployeeForm } from '@/features/employees/components/EmployeeForm';
import { useUpdateEmployee } from '@/features/employees/mutations';
import { employeeDetailQuery } from '@/features/employees/queries';
import { ApiError } from '@/lib/api';
import { Button } from '@/ui';

export function EmployeeEditPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const query = useQuery(employeeDetailQuery(employeeId!));
  const updateMutation = useUpdateEmployee(employeeId!);

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
      <h2 className="text-lg font-semibold text-slate-900">직원 정보 수정</h2>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EmployeeForm
          defaultValues={{
            name: employee.name,
            email: employee.email,
            department: employee.department,
            position: employee.position,
            status: employee.status,
            hiredAt: employee.hiredAt,
            resignedAt: employee.resignedAt ?? '',
          }}
          submitLabel="저장"
          onCancel={() => void navigate(`/employees/${employee.id}`)}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync(values);
            void navigate(`/employees/${employee.id}`);
          }}
        />
      </div>
    </div>
  );
}
