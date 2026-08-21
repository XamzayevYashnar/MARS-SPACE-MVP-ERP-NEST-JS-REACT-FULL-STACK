import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

/** Presentational table primitives. Data/interaction wiring (TanStack Table)
 *  lives in the admin feature layer; these just carry the design system. */

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-hairline">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-basalt-raised', className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-hairline', className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-basalt-raised/50', className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-hairline px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wide text-dust',
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-ice', className)} {...props} />;
}
