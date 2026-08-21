import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ eyebrow, title, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-8 flex items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-h2">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
