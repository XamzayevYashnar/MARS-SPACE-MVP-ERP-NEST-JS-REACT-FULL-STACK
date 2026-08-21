import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible label for the nav landmark. */
  label?: string;
  className?: string;
}

/** Build a compact page list with ellipses: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('gap');
  items.push(total);
  return items;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = 'Pagination',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);

  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label={label} className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        className={cn(btn, 'border-hairline text-dust hover:border-dust/40 hover:text-ice')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-dust" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              btn,
              item === page
                ? 'border-oxide bg-oxide/10 text-oxide'
                : 'border-hairline text-dust hover:border-dust/40 hover:text-ice',
            )}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={cn(btn, 'border-hairline text-dust hover:border-dust/40 hover:text-ice')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
