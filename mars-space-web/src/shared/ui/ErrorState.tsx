import { AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title: string;
  /** State what happened and how to fix it, without apologising (spec §4.8). */
  description?: string;
  /** Retry callback; renders a retry button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Retry',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-alert/40 bg-alert/5 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-alert/40 bg-alert/10">
        <AlertTriangle className="h-6 w-6 text-alert" aria-hidden="true" />
      </div>
      <h3 className="font-display text-h3">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-dust">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
