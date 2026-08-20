import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthUser } from '@/features/auth/auth';
import { can } from '@/features/auth/permissions';
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from '@/features/employees/labels';
import { employeeListQuery } from '@/features/employees/queries';
import { DEPARTMENTS, EMPLOYEE_STATUSES, type Employee } from '@/features/employees/types';
import { Badge, Button, DataTable, Pagination, SearchInput, Select, type Column } from '@/ui';
import { UserPlus } from 'lucide-react';

const PAGE_SIZE = 10;

function pickParam<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

const COLUMNS: Column<Employee>[] = [
  {
    key: 'name',
    header: '이름',
    render: (e) => (
      <div>
        <p className="font-medium text-slate-900">{e.name}</p>
        <p className="text-xs text-slate-500">{e.email}</p>
      </div>
    ),
  },
  { key: 'department', header: '부서', render: (e) => DEPARTMENT_LABELS[e.department] },
  { key: 'position', header: '직급', render: (e) => e.position },
  {
    key: 'status',
    header: '상태',
    render: (e) => (
      <Badge variant={STATUS_BADGE_VARIANTS[e.status]}>{STATUS_LABELS[e.status]}</Badge>
    ),
  },
  { key: 'hiredAt', header: '입사일', render: (e) => e.hiredAt, className: 'text-slate-500' },
];

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthUser();
  const canWrite = user !== null && can(user.role, 'employee.write');

  const search = searchParams.get('search') ?? '';
  const department = pickParam(searchParams.get('department'), DEPARTMENTS);
  const status = pickParam(searchParams.get('status'), EMPLOYEE_STATUSES);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const query = useQuery(
    employeeListQuery({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      department,
      status,
    }),
  );

  // 검색/필터가 바뀌면 page를 1로 리셋한다
  function updateParams(patch: Record<string, string>, options?: { replace?: boolean }) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next, options);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => updateParams({ search: value }, { replace: true })}
          placeholder="이름 또는 이메일 검색"
        />
        <Select
          value={department ?? ''}
          onChange={(value) => updateParams({ department: value })}
          allLabel="전체 부서"
          options={DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }))}
        />
        <Select
          value={status ?? ''}
          onChange={(value) => updateParams({ status: value })}
          allLabel="전체 상태"
          options={EMPLOYEE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
        {canWrite && (
          <div className="ml-auto">
            <Button onClick={() => void navigate('/employees/new')}>
              <UserPlus size={16} />
              직원 등록
            </Button>
          </div>
        )}
      </div>

      {query.isPending ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          불러오는 중…
        </div>
      ) : query.isError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-slate-500">직원 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={query.data.items}
            rowKey={(e) => e.id}
            onRowClick={(e) => void navigate(`/employees/${e.id}`)}
            isLoading={query.isPlaceholderData}
            emptyMessage="조건에 맞는 직원이 없습니다."
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={query.data.total}
            onPageChange={(next) => updateParams({ page: String(next) })}
          />
        </>
      )}
    </div>
  );
}
