import { useQuery } from '@tanstack/react-query';
import { CalendarOff, UserMinus, UserPlus, Users } from 'lucide-react';
import { HiresTrendChart } from '@/features/dashboard/components/HiresTrendChart';
import { dashboardSummaryQuery } from '@/features/dashboard/queries';
import { Button, StatCard } from '@/ui';

export function DashboardPage() {
  const query = useQuery(dashboardSummaryQuery());

  if (query.isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        불러오는 중…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500">대시보드 데이터를 불러오지 못했습니다.</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const { headcount, monthlyTrend } = query.data;
  const thisMonth = monthlyTrend.at(-1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="재직 인원"
          value={headcount.active}
          hint={`전체 ${headcount.total}명 (퇴사 ${headcount.resigned}명 포함)`}
          icon={<Users size={18} />}
        />
        <StatCard label="휴직 인원" value={headcount.onLeave} icon={<CalendarOff size={18} />} />
        <StatCard
          label="이번 달 입사"
          value={thisMonth?.hires ?? 0}
          icon={<UserPlus size={18} />}
        />
        <StatCard
          label="이번 달 퇴사"
          value={thisMonth?.resignations ?? 0}
          icon={<UserMinus size={18} />}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700">입퇴사 추이 (최근 12개월)</h3>
        <div className="mt-4">
          <HiresTrendChart data={monthlyTrend} />
        </div>
      </div>
    </div>
  );
}
