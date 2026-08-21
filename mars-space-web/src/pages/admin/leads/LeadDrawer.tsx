import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge, Button, Drawer, Modal, Select, Skeleton, Textarea } from '@/shared/ui';
import { useLocalize } from '@/shared/lib/localize';
import { formatPhone, phoneHref } from '@/shared/lib/formatPhone';
import { LEAD_STATUSES, type LeadStatus } from '@/shared/types/common.types';
import {
  useAdminLead,
  useAssignLead,
  useConvertLead,
  useUpdateLeadNote,
  useUpdateLeadStatus,
} from '@/entities/lead/admin';
import { usersResource, groupsResource } from '@/features/admin-crud/resources';

export interface LeadDrawerProps {
  leadId: string | undefined;
  onClose: () => void;
}

/** Note editor as a keyed child so its local copy resets per lead without an effect. */
function NoteEditor({
  initial,
  onSave,
  pending,
}: {
  initial: string;
  onSave: (note: string) => void;
  pending: boolean;
}) {
  const { t } = useTranslation('admin');
  const [note, setNote] = useState(initial);
  return (
    <>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
      <Button variant="secondary" size="sm" className="mt-2" loading={pending} onClick={() => onSave(note)}>
        {t('leads.drawer.saveNote')}
      </Button>
    </>
  );
}

export function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const { data: lead, isLoading } = useAdminLead(leadId);
  const users = usersResource.useList();
  const groups = groupsResource.useList();

  const setStatus = useUpdateLeadStatus();
  const assign = useAssignLead();
  const setNote = useUpdateLeadNote();
  const convert = useConvertLead();

  const [convertOpen, setConvertOpen] = useState(false);
  const [groupId, setGroupId] = useState('');

  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: t(`leads.status.${s}`) }));
  const userOptions = [
    { value: '', label: t('leads.unassigned') },
    ...(users.data?.items.map((usr) => ({ value: usr.id, label: usr.fullName })) ?? []),
  ];
  const groupOptions = groups.data?.items.map((g) => ({ value: g.id, label: g.name })) ?? [];

  const onConvert = () => {
    if (!leadId || !groupId) return;
    convert.mutate(
      { id: leadId, groupId },
      {
        onSuccess: () => {
          toast.success(t('leads.convert.success'));
          setConvertOpen(false);
          onClose();
        },
      },
    );
  };

  return (
    <>
      <Drawer
        open={Boolean(leadId)}
        onOpenChange={(v) => (v ? undefined : onClose())}
        title={lead?.fullName ?? '…'}
        closeLabel={tc('actions.close')}
        footer={
          lead && (
            <Button className="w-full" onClick={() => setConvertOpen(true)} disabled={lead.status === 'ENROLLED'}>
              {t('leads.drawer.convert')}
            </Button>
          )
        }
      >
        {isLoading || !lead ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="eyebrow mb-2">{t('leads.drawer.contact')}</h3>
              <a href={phoneHref(lead.phone)} className="block font-mono text-sm text-oxide">
                {formatPhone(lead.phone)}
              </a>
              {lead.course && <p className="mt-1 text-sm text-dust">{tl(lead.course.title)}</p>}
              {lead.message && <p className="mt-2 rounded-sm bg-basalt-raised p-3 text-sm text-ice">{lead.message}</p>}
            </section>

            <section>
              <h3 className="eyebrow mb-2">{t('table.status')}</h3>
              <Select
                value={lead.status}
                onValueChange={(v) => setStatus.mutate({ id: lead.id, status: v as LeadStatus })}
                options={statusOptions}
              />
            </section>

            <section>
              <h3 className="eyebrow mb-2">{t('leads.drawer.assignee')}</h3>
              <Select
                value={lead.assignedToId ?? ''}
                onValueChange={(v) => assign.mutate({ id: lead.id, assignedToId: v || null })}
                options={userOptions}
              />
            </section>

            <section>
              <h3 className="eyebrow mb-2">{t('leads.drawer.source')}</h3>
              <Badge>{lead.source}</Badge>
              {(lead.utmSource || lead.utmCampaign) && (
                <p className="mt-2 font-mono text-xs text-dust">
                  {[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ')}
                </p>
              )}
            </section>

            <section>
              <h3 className="eyebrow mb-2">{t('leads.drawer.note')}</h3>
              <NoteEditor
                key={lead.id}
                initial={lead.adminNote ?? ''}
                pending={setNote.isPending}
                onSave={(note) => setNote.mutate({ id: lead.id, note })}
              />
            </section>
          </div>
        )}
      </Drawer>

      <Modal
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title={t('leads.convert.title')}
        closeLabel={tc('actions.close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConvertOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button loading={convert.isPending} disabled={!groupId} onClick={onConvert}>
              {t('leads.convert.submit')}
            </Button>
          </>
        }
      >
        <label className="mb-1.5 block text-sm font-medium text-ice">{t('leads.convert.group')}</label>
        <Select
          value={groupId}
          onValueChange={setGroupId}
          options={groupOptions}
          placeholder={t('leads.convert.groupPlaceholder')}
        />
      </Modal>
    </>
  );
}
