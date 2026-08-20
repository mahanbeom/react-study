import { useEffect, useState } from 'react';
import { Button, FormField, Textarea } from '@/ui';

interface RejectDialogProps {
  open: boolean;
  requesterName: string;
  loading?: boolean;
  /** 서버 에러 등 확인이 필요한 메시지 */
  errorMessage?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function RejectDialog({
  open,
  requesterName,
  loading = false,
  errorMessage,
  onConfirm,
  onClose,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');

  // 다시 열릴 때 이전 입력을 비운다
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={loading ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="휴가 반려"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">휴가 반려</h2>
        <p className="mt-2 text-sm text-slate-500">
          {requesterName} 님의 휴가 신청을 반려합니다. 사유는 신청자에게 표시됩니다.
        </p>
        <div className="mt-4">
          <FormField label="반려 사유" htmlFor="rejectReason" required error={errorMessage}>
            <Textarea
              id="rejectReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 해당 기간 업무 일정과 겹칩니다"
              disabled={loading}
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            반려
          </Button>
        </div>
      </div>
    </div>
  );
}
