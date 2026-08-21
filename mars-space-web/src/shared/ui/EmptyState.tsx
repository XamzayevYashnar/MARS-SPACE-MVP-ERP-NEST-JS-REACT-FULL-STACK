import { type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** An actionable next step — empty states invite action (spec §4.8). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-hairline bg-basalt/50 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-hairline bg-basalt-raised">
        <Icon className="h-6 w-6 text-dust" aria-hidden="true" />
      </div>
      <h3 className="font-display text-h3">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-dust">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
