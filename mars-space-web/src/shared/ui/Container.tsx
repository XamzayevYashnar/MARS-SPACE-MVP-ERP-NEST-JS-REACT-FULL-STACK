import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

/** Centered content column, max-width 1280px with responsive gutters. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-container px-4 md:px-6 lg:px-8', className)} {...props} />;
}
