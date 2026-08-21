import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'border-hairline bg-basalt-raised text-dust',
        oxide: 'border-oxide/40 bg-oxide/10 text-oxide',
        sol: 'border-sol/40 bg-sol/10 text-sol',
        success: 'border-signal/40 bg-signal/10 text-signal',
        alert: 'border-alert/40 bg-alert/10 text-alert',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional status dot; status is communicated by label + colour, never colour alone. */
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export { badgeVariants };
