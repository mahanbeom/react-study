import { Outlet, useLocation } from 'react-router';
import { CalendarDays, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useAuthUser, useLogout } from '@/features/auth/auth';
import { ROLE_BADGE_VARIANTS, ROLE_LABELS } from '@/features/auth/labels';
import { AppShell, Badge, Header, Sidebar, type SidebarItem } from '@/ui';

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
  const { user } = useAuthUser();
  const logout = useLogout();

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={<span className="text-lg font-bold">HR Admin</span>}
          items={NAV_ITEMS}
          footer={
            user && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="flex items-center gap-1.5 font-medium">
                      {user.name}
                      <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    {/* 부서/부서장은 me 응답의 파생값 — role 배지와 달리 관계(직원→부서)에서 온다 */}
                    {user.department && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        {user.department.name}
                        {user.isManager && <Badge variant="info">부서장</Badge>}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm
                    text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )
          }
        />
      }
      header={<Header title={title} />}
    >
      <Outlet />
    </AppShell>
  );
}
