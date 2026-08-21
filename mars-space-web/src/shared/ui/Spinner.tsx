import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  /** Accessible label; defaults to a generic loading string. */
  label?: string;
}

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn('animate-spin text-current', sizes[size], className)}
    />
  );
}
