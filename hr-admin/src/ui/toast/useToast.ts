import { useContext } from 'react';
import { ToastContext, type ToastApi } from './ToastProvider';

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('useToast는 <ToastProvider> 안에서만 사용할 수 있습니다');
  }
  return api;
}
