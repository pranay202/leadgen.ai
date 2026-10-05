import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            aria-describedby={descriptionId}
            aria-invalid={!!error}
            className={cn(
              'flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-11',
              error && 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/10',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600">{error}</p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
