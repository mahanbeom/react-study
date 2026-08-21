import { X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

// 참고: 더 큰 앱에서는 React 밖에서도 호출 가능한 standalone toast()(sonner 방식)와
// MutationCache 전역 onError 조합이 흔하지만, context 기반 훅이 의존 관계가 명시적이라 채택.
export const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-slate-900 text-white',
  error: 'bg-red-600 text-white',
};

interface ToastProviderProps {
  children: ReactNode;
  /** 자동 닫힘까지의 시간(ms) — 테스트에서 짧게 오버라이드한다 */
  successDuration?: number;
  errorDuration?: number;
}

export function ToastProvider({
  children,
  successDuration = 4000,
  errorDuration = 6000, // 에러는 읽을 시간을 더 준다
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant, message }]);
      const duration = variant === 'success' ? successDuration : errorDuration;
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss, successDuration, errorDuration],
  );

  // 언마운트 시 남은 타이머 정리 — 테스트에서 핸들 누수/act 경고를 막는다
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* viewport — ConfirmDialog(z-50)보다 위, 우하단 스택 */}
      <div aria-label="알림" className="fixed right-4 bottom-4 z-60 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            // success는 흐름을 끊지 않는 polite(status), error는 즉시 공지하는 assertive(alert)
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-lg ${VARIANT_CLASSES[t.variant]}`}
          >
            <p className="text-sm">{t.message}</p>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
