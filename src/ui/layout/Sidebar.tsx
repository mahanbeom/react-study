import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

export interface SidebarItem {
  label: string;
  to: string;
  icon?: ReactNode;
  /** true면 경로가 정확히 일치할 때만 활성 처리 (기본: 하위 경로 포함) */
  end?: boolean;
}

interface SidebarProps {
  /** 상단 브랜드 영역 (로고/서비스명) */
  brand: ReactNode;
  items: SidebarItem[];
  /** 하단 고정 영역 (사용자 정보, 로그아웃 등) */
  footer?: ReactNode;
}

export function Sidebar({ brand, items, footer }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-4">{brand}</div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      {footer ? <div className="border-t border-slate-200 p-3">{footer}</div> : null}
    </aside>
  );
}
