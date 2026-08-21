import { useQuery } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthUser } from '@/features/auth/auth';
import { can } from '@/features/auth/permissions';
import { RejectDialog } from '@/features/leave/components/RejectDialog';
import {
  LEAVE_STATUS_BADGE_VARIANTS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
} from '@/features/leave/labels';
import { useDecideLeaveRequest } from '@/features/leave/mutations';
import { leaveListQuery } from '@/features/leave/queries';
import { LEAVE_STATUSES, type LeaveRequest, type LeaveStatus } from '@/features/leave/types';
import { Badge, Button, ConfirmDialog, DataTable, Pagination, Tabs, type Column } from '@/ui';

const PAGE_SIZE = 10;

const TAB_ITEMS = [
  ...LEAVE_STATUSES.map((s) => ({ value: s, label: LEAVE_STATUS_LABELS[s] })),
  { value: 'all', label: '전체' },
];

type DialogState = { action: 'approve' | 'reject'; request: LeaveRequest } | null;

export function LeavePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<DialogState>(null);

  const statusParam = searchParams.get('status') ?? 'pending';
  const status = (LEAVE_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as LeaveStatus)
    : undefined; // 'all' 또는 잘못된 값 → 전체
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const query = useQuery(leaveListQuery({ status, page, pageSize: PAGE_SIZE }));
  const decideMutation = useDecideLeaveRequest();
  const { user } = useAuthUser();
  const canDecide = user !== null && can(user.role, 'leave.decide');

  function changeTab(value: string) {
    setSearchParams({ status: value }); // page는 1로 리셋
  }

  function changePage(next: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(next));
    setSearchParams(params);
  }

  function closeDialog() {
    setDialog(null);
  }

  function handleDecide(rejectReason?: string) {
    if (!dialog) return;
    decideMutation.mutate({ id: dialog.request.id, action: dialog.action, rejectReason });
    // 낙관적 업데이트: 서버 응답을 기다리지 않고 바로 닫는다.
    // 결과 피드백(성공/롤백)은 훅의 토스트가 담당한다.
    closeDialog();
  }

  const columns: Column<LeaveRequest>[] = [
    { key: 'employee', header: '신청자', render: (r) => r.employeeName },
    { key: 'type', header: '유형', render: (r) => LEAVE_TYPE_LABELS[r.type] },
    {
      key: 'period',
      header: '기간',
      render: (r) => (r.startDate === r.endDate ? r.startDate : `${r.startDate} ~ ${r.endDate}`),
      className: 'whitespace-nowrap',
    },
    {
      key: 'reason',
      header: '사유',
      render: (r) => (
        <div>
          <p className="max-w-56 truncate">{r.reason}</p>
          {r.status === 'rejected' && r.rejectReason && (
            <p className="max-w-56 truncate text-xs text-red-500">반려: {r.rejectReason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (r) => (
        <Badge variant={LEAVE_STATUS_BADGE_VARIANTS[r.status]}>
          {LEAVE_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    { key: 'createdAt', header: '신청일', render: (r) => r.createdAt, className: 'text-slate-500' },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        canDecide && r.status === 'pending' ? (
          <div className="flex justify-end gap-1.5">
            <Button
              className="h-7 px-2.5 text-xs"
              onClick={() => setDialog({ action: 'approve', request: r })}
            >
              승인
            </Button>
            <Button
              variant="secondary"
              className="h-7 px-2.5 text-xs"
              onClick={() => setDialog({ action: 'reject', request: r })}
            >
              반려
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <Tabs items={TAB_ITEMS} value={status ?? 'all'} onChange={changeTab} />
        <Button onClick={() => void navigate('/leave/new')}>
          <CalendarPlus size={16} />
          휴가 신청
        </Button>
      </div>

      {query.isPending ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          불러오는 중…
        </div>
      ) : query.isError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-slate-500">휴가 신청 목록을 불러오지 못했습니다.</p>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={query.data.items}
            rowKey={(r) => r.id}
            isLoading={query.isPlaceholderData}
            emptyMessage="해당 상태의 휴가 신청이 없습니다."
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={query.data.total}
            onPageChange={changePage}
          />
        </>
      )}

      <ConfirmDialog
        open={dialog?.action === 'approve'}
        title="휴가 승인"
        description={dialog ? `${dialog.request.employeeName} 님의 휴가 신청을 승인할까요?` : ''}
        confirmLabel="승인"
        onConfirm={() => handleDecide()}
        onClose={closeDialog}
      />
      <RejectDialog
        open={dialog?.action === 'reject'}
        requesterName={dialog?.request.employeeName ?? ''}
        onConfirm={(reason) => handleDecide(reason)}
        onClose={closeDialog}
      />
    </div>
  );
}
