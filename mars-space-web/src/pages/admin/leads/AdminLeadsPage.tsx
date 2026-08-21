import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { KanbanSquare, Table as TableIcon } from 'lucide-react';
import { Badge, Button, Select } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { useLocalize } from '@/shared/lib/localize';
import { formatPhone } from '@/shared/lib/formatPhone';
import { formatDate } from '@/shared/lib/formatDate';
import { LEAD_STATUSES, type LeadStatus } from '@/shared/types/common.types';
import { useAdminLeads } from '@/entities/lead/admin';
import type { Lead } from '@/entities/lead/types';
import { cn } from '@/shared/lib/cn';
import { LeadKanban } from './LeadKanban';
import { LeadDrawer } from './LeadDrawer';

const STATUS_VARIANT: Record<LeadStatus, 'neutral' | 'sol' | 'oxide' | 'success' | 'alert'> = {
  NEW: 'neutral',
  IN_PROGRESS: 'sol',
  CONTACTED: 'oxide',
  ENROLLED: 'success',
  REJECTED: 'alert',
};

export function AdminLeadsPage() {
  const { t } = useTranslation('admin');
  const { t: tl, lang } = useLocalize();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [openId, setOpenId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const query = useAdminLeads({ page, limit: 20, status: status || undefined });

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      {
        header: t('leads.columns.name'),
        accessorKey: 'fullName',
        cell: (c) => <span className="font-medium text-ice">{c.row.original.fullName}</span>,
      },
      {
        header: t('leads.columns.phone'),
        cell: (c) => <span className="font-mono text-xs">{formatPhone(c.row.original.phone)}</span>,
      },
      {
        header: t('leads.columns.course'),
        cell: (c) => (c.row.original.course ? tl(c.row.original.course.title) : '—'),
      },
      {
        header: t('leads.columns.status'),
        cell: (c) => (
          <Badge variant={STATUS_VARIANT[c.row.original.status]} dot>
            {t(`leads.status.${c.row.original.status}`)}
          </Badge>
        ),
      },
      {
        header: t('leads.columns.assignee'),
        cell: (c) => c.row.original.assignedTo?.fullName ?? t('leads.unassigned'),
      },
      {
        header: t('leads.columns.date'),
        cell: (c) => (
          <span className="font-mono text-xs text-dust">{formatDate(c.row.original.createdAt, lang)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => (
          <Button variant="ghost" size="sm" onClick={() => setOpenId(c.row.original.id)}>
            {t('actions.edit')}
          </Button>
        ),
      },
    ],
    [t, tl, lang],
  );

  const statusFilter = (
    <Select
      className="w-44"
      aria-label={t('leads.filters.status')}
      value={status}
      onValueChange={(v) => {
        setStatus(v as LeadStatus | '');
        setPage(1);
      }}
      options={[
        { value: '', label: t('leads.filters.all') },
        ...LEAD_STATUSES.map((s) => ({ value: s, label: t(`leads.status.${s}`) })),
      ]}
    />
  );

  const viewToggle = (
    <div className="inline-flex rounded-sm border border-hairline p-0.5">
      {(['table', 'kanban'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => setView(v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors',
            view === v ? 'bg-basalt-raised text-ice' : 'text-dust hover:text-ice',
          )}
        >
          {v === 'table' ? <TableIcon className="h-4 w-4" /> : <KanbanSquare className="h-4 w-4" />}
          {t(`leads.view.${v}`)}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Seo title={t('leads.title')} noindex />
      <AdminPageHeader
        title={t('leads.title')}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {statusFilter}
            {viewToggle}
          </div>
        }
      />

      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={query.data?.items}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          page={query.data?.meta.page}
          totalPages={query.data?.meta.totalPages}
          onPageChange={setPage}
        />
      ) : (
        <LeadKanban leads={query.data?.items ?? []} onOpen={setOpenId} />
      )}

      <LeadDrawer leadId={openId} onClose={() => setOpenId(undefined)} />
    </>
  );
}
