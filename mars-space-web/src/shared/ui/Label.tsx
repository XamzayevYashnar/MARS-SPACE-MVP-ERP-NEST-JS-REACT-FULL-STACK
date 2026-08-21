import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('mb-1.5 block text-sm font-medium text-ice', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-oxide" aria-hidden="true">
          *
        </span>
      )}
    </label>
  ),
);
Label.displayName = 'Label';
