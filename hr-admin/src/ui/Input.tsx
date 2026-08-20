import type { ComponentProps } from 'react';

/** react-hook-form register와 호환 (React 19 — ref가 일반 prop으로 전달된다) */
export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm
        placeholder:text-slate-400 focus:border-slate-500 focus:outline-none
        disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
    />
  );
}
