import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/ui';
import { useLocalize } from '@/shared/lib/localize';
import { formatPhone } from '@/shared/lib/formatPhone';
import { LEAD_STATUSES, type LeadStatus } from '@/shared/types/common.types';
import { useUpdateLeadStatus } from '@/entities/lead/admin';
import type { Lead } from '@/entities/lead/types';
import { cn } from '@/shared/lib/cn';

export interface LeadKanbanProps {
  leads: Lead[];
  onOpen: (id: string) => void;
}

/**
 * Kanban with native drag-and-drop and optimistic status change. Each card also
 * carries a status <Select> as the keyboard-accessible alternative (spec §10).
 */
export function LeadKanban({ leads, onOpen }: LeadKanbanProps) {
  const { t } = useTranslation('admin');
  const { t: tl } = useLocalize();
  const setStatus = useUpdateLeadStatus();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  const move = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (lead && lead.status !== status) setStatus.mutate({ id, status });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={() => {
              if (dragId) move(dragId, status);
              setDragId(null);
              setOverCol(null);
            }}
            className={cn(
              'flex min-h-[120px] flex-col rounded-md border bg-basalt p-2',
              overCol === status ? 'border-oxide' : 'border-hairline',
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-mono text-xs uppercase text-dust">{t(`leads.status.${status}`)}</span>
              <span className="font-mono text-xs text-dust">{columnLeads.length}</span>
            </div>
            <div className="space-y-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab rounded-sm border border-hairline bg-basalt-raised p-3 active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(lead.id)}
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
                  >
                    <span className="block text-sm text-ice">{lead.fullName}</span>
                    <span className="block font-mono text-xs text-dust">{formatPhone(lead.phone)}</span>
                    {lead.course && (
                      <span className="mt-1 block truncate text-xs text-dust">{tl(lead.course.title)}</span>
                    )}
                  </button>
                  <Select
                    className="mt-2 h-8"
                    aria-label={t('table.status')}
                    value={lead.status}
                    onValueChange={(v) => move(lead.id, v as LeadStatus)}
                    options={LEAD_STATUSES.map((s) => ({ value: s, label: t(`leads.status.${s}`) }))}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
