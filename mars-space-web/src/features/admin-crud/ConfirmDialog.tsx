import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/shared/ui';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Description naming the record being affected (spec §6.4). */
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger = true,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      closeLabel={t('actions.close')}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel ?? t('actions.save')}
          </Button>
        </>
      }
    >
      <span className="sr-only">{description}</span>
    </Modal>
  );
}
