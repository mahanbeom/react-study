export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** 값이 빈 문자열인 "전체" 항목의 라벨 (예: "전체 부서") */
  allLabel?: string;
}

export function Select({ value, onChange, options, allLabel }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm
        focus:border-slate-500 focus:outline-none"
    >
      {allLabel !== undefined && <option value="">{allLabel}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
