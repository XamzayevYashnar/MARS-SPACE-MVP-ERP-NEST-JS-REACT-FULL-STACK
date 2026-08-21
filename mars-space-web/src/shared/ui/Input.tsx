import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Optional leading adornment (e.g. an icon). */
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leading, ...props }, ref) => {
    return (
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dust">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-10 w-full rounded-sm border bg-basalt-raised px-3 text-sm text-ice',
            'placeholder:text-dust/70 transition-colors duration-120',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leading && 'pl-9',
            invalid ? 'border-alert focus-visible:ring-alert' : 'border-hairline hover:border-dust/40',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';
