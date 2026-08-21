import { type ReactNode } from 'react';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-h2">{title}</h1>
        {description && <p className="mt-1 text-sm text-dust">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
