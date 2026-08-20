import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchInputProps {
  value: string;
  /** 디바운스가 끝난 뒤 호출된다 */
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
}

export function SearchInput({ value, onChange, placeholder, delayMs = 300 }: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  // 외부에서 값이 바뀌면(뒤로가기 등) 입력값을 동기화한다
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, delayMs, onChange]);

  return (
    <div className="relative">
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-64 rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm
          placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
      />
    </div>
  );
}
