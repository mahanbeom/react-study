import type { ReactNode } from 'react';

interface HeaderProps {
  title: ReactNode;
  /** 우측 액션 영역 (검색, 알림, 프로필 등) */
  actions?: ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-base font-semibold">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
