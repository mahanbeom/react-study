import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/ui';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      {/* 토스트는 QueryClient처럼 전역 인프라 — 레이아웃 밖(LoginPage 포함)에서도 쓰인다 */}
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
