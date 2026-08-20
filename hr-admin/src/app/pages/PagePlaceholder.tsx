interface PagePlaceholderProps {
  step: string;
  description: string;
}

/** 아직 구현하지 않은 단계의 자리 표시 페이지 */
export function PagePlaceholder({ step, description }: PagePlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-10 py-8 text-center">
        <p className="text-sm font-semibold text-slate-400">{step}에서 구현 예정</p>
        <p className="mt-1 text-slate-700">{description}</p>
      </div>
    </div>
  );
}
