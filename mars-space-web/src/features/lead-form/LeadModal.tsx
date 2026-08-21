import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui';
import { LeadForm } from './LeadForm';
import { useLeadModal } from './lead-modal.store';

/**
 * Global lead-capture modal. Mounted once in the public layout; any CTA opens
 * it (optionally pre-filled with a course) via the useLeadModal store.
 */
export function LeadModal() {
  const { t } = useTranslation();
  const { open, courseId, courseTitle, source, closeModal } = useLeadModal();

  return (
    <Modal
      open={open}
      onOpenChange={(v) => (v ? undefined : closeModal())}
      title={t('lead.title')}
      description={t('lead.subtitle')}
      closeLabel={t('actions.close')}
    >
      <LeadForm
        courseId={courseId}
        courseTitle={courseTitle}
        source={source ?? 'WEBSITE_FORM'}
        onSuccess={() => undefined}
      />
    </Modal>
  );
}
