import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

/** 어드민 공통 골격: 좌측 사이드바 + (헤더 + 콘텐츠) 영역 */
export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className="flex h-dvh bg-slate-50 text-slate-900">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
