import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Loading placeholder. Match the final layout's dimensions to avoid CLS
 * (spec §10). The pulse is suppressed under prefers-reduced-motion via globals.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-basalt-raised', className)}
      {...props}
    />
  );
}
