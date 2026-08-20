import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { useAuthUser, useLogin } from '@/features/auth/auth';
import { loginFormSchema, type LoginFormValues } from '@/features/auth/schema';
import { ApiError } from '@/lib/api';
import { Button, FormField, Input } from '@/ui';

export function LoginPage() {
  const location = useLocation();
  const loginMutation = useLogin();
  const { user } = useAuthUser();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  // 이미 로그인 상태(로그인 성공 직후 포함)면 원래 가려던 곳으로
  if (user) return <Navigate to={from} replace />;

  async function submit(values: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(values);
      // 이동은 위의 <Navigate>가 담당한다 (user 캐시가 채워지면서 리렌더)
    } catch (error) {
      setError('root', {
        type: 'server',
        message:
          error instanceof ApiError && error.status === 401
            ? '이메일 또는 비밀번호가 올바르지 않습니다'
            : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="text-lg font-bold text-slate-900">HR Admin 로그인</h1>
          <form onSubmit={handleSubmit(submit)} noValidate className="mt-6 space-y-4">
            {errors.root && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.root.message}
              </p>
            )}
            <FormField label="이메일" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@hrcorp.dev"
                {...register('email')}
              />
            </FormField>
            <FormField label="비밀번호" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </FormField>
            <Button type="submit" loading={isSubmitting} className="w-full">
              로그인
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">연습용 데모 계정</p>
          <p className="mt-1.5">
            관리자: <code className="text-slate-700">admin@hrcorp.dev / admin123</code>
          </p>
          <p className="mt-0.5">
            일반: <code className="text-slate-700">member@hrcorp.dev / member123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
