import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-slate-50">
      <p className="text-4xl font-bold text-slate-300">404</p>
      <p className="text-slate-600">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        대시보드로 이동
      </Link>
    </div>
  );
}
