import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  // Base: instrument-panel shape (2px radius), no pills, visible focus ring.
  'relative inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-120 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-oxide text-ice hover:bg-oxide/90 active:bg-oxide/80',
        secondary: 'border border-hairline bg-transparent text-ice hover:border-oxide/40 hover:bg-basalt-raised',
        ghost: 'bg-transparent text-dust hover:bg-basalt-raised hover:text-ice',
        danger: 'bg-alert text-ice hover:bg-alert/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner, hides the label, and locks the width (spec §4.5). */
  loading?: boolean;
  /** Render as the child element (e.g. a router Link) via Radix Slot. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, asChild, children, ...props }, ref) => {
    // asChild renders a single child (a link) with button styling — no spinner.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="sm" />
          </span>
        )}
        {/* Label stays in the DOM (invisible while loading) so width is locked. */}
        <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
