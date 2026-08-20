import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium
        transition-colors disabled:pointer-events-none disabled:opacity-50
        ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
