import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui';
import { paths } from '@/app/router/paths';
import { useLocalize } from '@/shared/lib/localize';
import type { Teacher } from '../types';

export interface TeacherCardProps {
  teacher: Pick<Teacher, 'slug' | 'fullName' | 'position' | 'photoUrl' | 'skills'>;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const { t: tl } = useLocalize();
  const initials = teacher.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <Card interactive className="h-full">
      <Link
        to={paths.teacher(teacher.slug)}
        className="flex h-full flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
      >
        <div className="mb-4 h-16 w-16 overflow-hidden rounded-md border border-hairline bg-basalt-raised">
          {teacher.photoUrl ? (
            <img
              src={teacher.photoUrl}
              alt={teacher.fullName}
              loading="lazy"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-lg text-dust">
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-display text-lg">{teacher.fullName}</h3>
        <p className="mt-1 text-sm text-dust">{tl(teacher.position)}</p>
        {teacher.skills.length > 0 && (
          <p className="mt-3 font-mono text-xs text-dust">{teacher.skills.slice(0, 3).join(' · ')}</p>
        )}
      </Link>
    </Card>
  );
}
