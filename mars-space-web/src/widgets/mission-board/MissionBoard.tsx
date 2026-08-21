import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/shared/ui';
import { useUpcomingGroups } from '@/entities/group/hooks';
import { useLocalize } from '@/shared/lib/localize';
import { formatDateShort } from '@/shared/lib/formatDate';
import { useLeadModal } from '@/features/lead-form';
import type { UpcomingGroup } from '@/entities/group/types';
import { cn } from '@/shared/lib/cn';

const WEEKDAY_SHORT: Record<string, string> = {
  MON: 'Du',
  TUE: 'Se',
  WED: 'Cho',
  THU: 'Pa',
  FRI: 'Ju',
  SAT: 'Sha',
  SUN: 'Ya',
};

function SeatReadout({ group }: { group: UpcomingGroup }) {
  const { t } = useTranslation('home');
  if (group.freeSeats <= 0) {
    return <span className="font-mono text-xs font-medium text-alert">FULL</span>;
  }
  const low = group.freeSeats <= 3;
  return (
    <span className={cn('font-mono text-xs font-medium', low ? 'text-sol' : 'text-signal')}>
      {group.freeSeats} {t('missionBoard.col.seats').toLowerCase()}
    </span>
  );
}

export function MissionBoard() {
  const { t } = useTranslation('home');
  const { t: tl, lang } = useLocalize();
  const openModal = useLeadModal((s) => s.openModal);
  const { data, isLoading, isError } = useUpcomingGroups({ limit: 6 });

  return (
    <div className="corner-ticks rounded-md border border-hairline bg-basalt">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <span className="eyebrow">{t('missionBoard.title')}</span>
        <span className="font-mono text-xs text-dust">LAUNCH WINDOWS</span>
      </div>

      <div className="divide-y divide-hairline">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}

        {!isLoading && (isError || !data || data.length === 0) && (
          <p className="px-4 py-8 text-center text-sm text-dust">{t('missionBoard.empty')}</p>
        )}

        {!isLoading &&
          data?.map((group, i) => {
            const full = group.freeSeats <= 0;
            return (
              <button
                key={group.id}
                type="button"
                disabled={full}
                onClick={() =>
                  openModal({
                    courseId: group.courseId,
                    courseTitle: group.course ? tl(group.course.title) : undefined,
                    source: 'HERO_FORM',
                  })
                }
                // CSS reveal (staggered); suppressed under prefers-reduced-motion via globals.
                style={{ animationDelay: `${i * 60}ms` }}
                className={cn(
                  'flex w-full animate-rise-in items-center gap-3 px-4 py-3 text-left transition-colors',
                  full
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:bg-basalt-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
                )}
              >
                <span className="w-20 shrink-0 font-mono text-xs text-oxide">{group.name}</span>
                <span className="flex-1 truncate text-sm text-ice">
                  {group.course ? tl(group.course.title) : '—'}
                  <span className="ml-2 font-mono text-xs text-dust">
                    {formatDateShort(group.startDate, lang)} ·{' '}
                    {group.weekDays.map((d) => WEEKDAY_SHORT[d] ?? d).join('/')}
                  </span>
                </span>
                <SeatReadout group={group} />
                {!full && <ArrowUpRight className="h-4 w-4 shrink-0 text-dust" />}
              </button>
            );
          })}
      </div>
    </div>
  );
}
