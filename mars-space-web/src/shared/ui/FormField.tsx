import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Label } from './Label';

export interface FormFieldProps {
  label: string;
  /** Resolved error message (already translated at the call site). */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Render prop receives the id + aria wiring to spread onto the control. */
  children: (field: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

/**
 * Ties a label, hint and error message to a control with correct aria wiring.
 * Keeps every form field consistent and accessible (spec §9/§10).
 */
export function FormField({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-dust">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
