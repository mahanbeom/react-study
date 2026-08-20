import { useNavigate } from 'react-router';
import { EmployeeForm } from '@/features/employees/components/EmployeeForm';
import { useCreateEmployee } from '@/features/employees/mutations';

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateEmployee();

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">직원 등록</h2>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EmployeeForm
          submitLabel="등록"
          onCancel={() => void navigate('/employees')}
          onSubmit={async (values) => {
            const created = await createMutation.mutateAsync(values);
            void navigate(`/employees/${created.id}`);
          }}
        />
      </div>
    </div>
  );
}
