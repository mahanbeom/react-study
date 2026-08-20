import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** 현재 페이지 주변 최대 5개의 페이지 번호를 만든다 */
function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buttonClass =
    'flex size-8 items-center justify-center rounded-md text-sm transition-colors ' +
    'disabled:opacity-40 disabled:cursor-default enabled:hover:bg-slate-100';

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">총 {total}건</p>
      <nav className="flex items-center gap-1">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={16} />
        </button>
        {pageWindow(page, totalPages).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`size-8 rounded-md text-sm transition-colors ${
              n === page ? 'bg-slate-900 font-semibold text-white' : 'hover:bg-slate-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
