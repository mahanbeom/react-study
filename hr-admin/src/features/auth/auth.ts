import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { clearToken, getToken, setToken } from '@/lib/token';
import { fetchMe, login } from './api';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * 현재 로그인 사용자.
 * 토큰이 있으면 /auth/me로 복원한다 (새로고침 대응).
 */
export function useAuthUser() {
  const hasToken = !!getToken();
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: hasToken,
    staleTime: Infinity,
    retry: false,
  });

  return {
    user: query.data ?? null,
    /** 토큰은 있는데 아직 사용자 복원 중 */
    isRestoring: hasToken && query.isPending,
    /** 토큰이 무효함 (me 401) */
    isInvalid: query.isError,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setToken(token);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    clearToken();
    queryClient.clear(); // 사용자별 데이터가 남지 않도록 캐시 전체 정리
    void navigate('/login', { replace: true });
  };
}
