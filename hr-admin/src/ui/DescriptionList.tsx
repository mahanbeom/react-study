import type { ReactNode } from 'react';

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

/** 상세 화면용 라벨-값 목록 */
export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-3 gap-4 py-3">
          <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
          <dd className="col-span-2 text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
