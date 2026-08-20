import { Navigate, Outlet } from 'react-router';
import { useAuthUser } from '../auth';
import { can, type PermissionAction } from '../permissions';

/** 권한 없는 라우트 진입을 홈으로 돌려보낸다. RequireAuth 안쪽에서만 사용한다. */
export function RequireRole({ action }: { action: PermissionAction }) {
  const { user } = useAuthUser();
  if (user && !can(user.role, action)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
