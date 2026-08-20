import { Outlet, useLocation } from 'react-router';
import { CalendarDays, LayoutDashboard, Users } from 'lucide-react';
import { AppShell, Header, Sidebar, type SidebarItem } from '@/ui';

const NAV_ITEMS: SidebarItem[] = [
  { label: '대시보드', to: '/', end: true, icon: <LayoutDashboard size={18} /> },
  { label: '직원 관리', to: '/employees', icon: <Users size={18} /> },
  { label: '휴가 관리', to: '/leave', icon: <CalendarDays size={18} /> },
];

function usePageTitle(): string {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));
  return item?.label ?? 'HR Admin';
}

export function AdminLayout() {
  const title = usePageTitle();
  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={<span className="text-lg font-bold">HR Admin</span>}
          items={NAV_ITEMS}
          footer={
            // 6단계(로그인/권한)에서 실제 로그인 사용자 정보로 교체한다
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                관
              </div>
              <div className="text-sm">
                <p className="font-medium">관리자</p>
                <p className="text-xs text-slate-500">admin@example.com</p>
              </div>
            </div>
          }
        />
      }
      header={<Header title={title} />}
    >
      <Outlet />
    </AppShell>
  );
}
