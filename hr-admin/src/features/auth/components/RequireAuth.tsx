import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { clearToken } from '@/lib/token';
import { useAuthUser } from '../auth';

/** 미로그인 접근을 /login으로 보낸다. 로그인 후 돌아올 수 있게 원래 경로를 state로 남긴다. */
export function RequireAuth() {
  const location = useLocation();
  const { user, isRestoring, isInvalid } = useAuthUser();

  // 무효 토큰(me 401)은 정리해서 로그인 화면으로 보낸다
  useEffect(() => {
    if (isInvalid) clearToken();
  }, [isInvalid]);

  if (isRestoring) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50 text-sm text-slate-400">
        확인 중…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
