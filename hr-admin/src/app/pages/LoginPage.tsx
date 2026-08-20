import { Link } from 'react-router';

export function LoginPage() {
  return (
    <div className="flex h-dvh items-center justify-center bg-slate-50">
      <div className="w-80 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold">HR Admin 로그인</h1>
        <p className="mt-2 text-sm text-slate-500">6단계에서 구현 예정 — 로그인 + 권한 분기</p>
        <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
