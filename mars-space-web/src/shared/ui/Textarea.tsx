import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-sm border bg-basalt-raised px-3 py-2 text-sm text-ice',
        'placeholder:text-dust/70 transition-colors duration-120 resize-y',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-alert focus-visible:ring-alert' : 'border-hairline hover:border-dust/40',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
