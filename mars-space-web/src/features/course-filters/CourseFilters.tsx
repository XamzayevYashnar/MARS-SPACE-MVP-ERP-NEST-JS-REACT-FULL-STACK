import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Button, Input, Select } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useLocalize } from '@/shared/lib/localize';
import { COURSE_FORMATS, COURSE_LEVELS } from '@/shared/types/common.types';
import type { CourseFormat, CourseLevel } from '@/shared/types/common.types';
import type { Category } from '@/entities/category/types';
import { cn } from '@/shared/lib/cn';

export interface CourseFilterValues {
  search: string;
  category?: string;
  level?: CourseLevel;
  format?: CourseFormat;
}

export interface CourseFiltersProps {
  categories: Category[] | undefined;
  values: CourseFilterValues;
  onChange: (patch: Partial<CourseFilterValues>) => void;
  onClear: () => void;
}

/** Sticky filter bar; all state is owned by the page and synced to the URL. */
export function CourseFilters({ categories, values, onChange, onClear }: CourseFiltersProps) {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();

  // Local search state → debounced up to the page (350ms, spec §6.2).
  const [search, setSearch] = useState(values.search);
  const debounced = useDebounce(search, 350);
  useEffect(() => {
    if (debounced !== values.search) onChange({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const hasActive = Boolean(values.category || values.level || values.format || values.search);

  return (
    <div className="sticky top-16 z-20 -mx-4 border-b border-hairline bg-void/90 px-4 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Input
          leading={<Search className="h-4 w-4" />}
          placeholder={t('filters.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('filters.search')}
          className="lg:max-w-xs"
        />

        <div className="flex flex-wrap gap-3">
          <Select
            aria-label={t('filters.level')}
            value={values.level ?? ''}
            onValueChange={(v) => onChange({ level: (v || undefined) as CourseLevel | undefined })}
            placeholder={t('filters.level')}
            className="w-40"
            options={[
              { value: '', label: t('filters.all') },
              ...COURSE_LEVELS.map((lv) => ({ value: lv, label: tc(`course.level.${lv}`) })),
            ]}
          />
          <Select
            aria-label={t('filters.format')}
            value={values.format ?? ''}
            onValueChange={(v) => onChange({ format: (v || undefined) as CourseFormat | undefined })}
            placeholder={t('filters.format')}
            className="w-40"
            options={[
              { value: '', label: t('filters.all') },
              ...COURSE_FORMATS.map((f) => ({ value: f, label: tc(`course.format.${f}`) })),
            ]}
          />
          {hasActive && (
            <Button variant="ghost" size="md" onClick={onClear}>
              <X className="h-4 w-4" /> {t('filters.clear')}
            </Button>
          )}
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = values.category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ category: active ? undefined : cat.slug })}
                className={cn(
                  'rounded-sm border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
                  active
                    ? 'border-oxide bg-oxide/10 text-oxide'
                    : 'border-hairline text-dust hover:border-dust/40 hover:text-ice',
                )}
              >
                {tl(cat.name)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
