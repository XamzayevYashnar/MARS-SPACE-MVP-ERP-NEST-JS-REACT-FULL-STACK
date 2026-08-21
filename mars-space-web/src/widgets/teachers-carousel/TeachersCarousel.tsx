import { Skeleton } from '@/shared/ui';
import { TeacherCard } from '@/entities/teacher/ui/TeacherCard';
import { useTeachers } from '@/entities/teacher/hooks';

/** Horizontal scroll strip of teacher cards (spec §6.1). */
export function TeachersCarousel() {
  const { data, isLoading } = useTeachers({ limit: 12 });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-64 shrink-0" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
      {data.items.map((teacher) => (
        <div key={teacher.id} className="w-64 shrink-0 snap-start">
          <TeacherCard teacher={teacher} />
        </div>
      ))}
    </div>
  );
}
