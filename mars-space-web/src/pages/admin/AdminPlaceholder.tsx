import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';
import { Seo } from '@/shared/seo/Seo';

export interface AdminPlaceholderProps {
  /** admin-namespace nav key, e.g. "courses". */
  titleKey: string;
}

/**
 * Temporary admin section shell. Each CRUD screen replaces this in the admin
 * build stage; kept so every admin route already resolves and is guarded.
 */
export function AdminPlaceholder({ titleKey }: AdminPlaceholderProps) {
  const { t } = useTranslation('admin');
  const title = t(titleKey as never, { defaultValue: titleKey });

  return (
    <>
      <Seo title={String(title)} noindex />
      <h1 className="font-display text-h2">{String(title)}</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-md border border-dashed border-hairline py-20 text-center">
        <Construction className="mb-4 h-8 w-8 text-dust" />
        <p className="text-dust">{t('wip')}</p>
      </div>
    </>
  );
}
