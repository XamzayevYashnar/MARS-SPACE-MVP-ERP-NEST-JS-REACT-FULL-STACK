import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enables hover affordance: border → oxide/40 and a 2px lift (no scale). */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md border border-hairline bg-basalt',
        interactive &&
          'transition-[transform,border-color] duration-120 ease-out hover:-translate-y-0.5 hover:border-oxide/40',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-0', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-hairline p-5', className)} {...props} />
  );
}
