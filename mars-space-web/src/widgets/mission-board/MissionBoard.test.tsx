import { describe, expect, it, vi, beforeAll } from 'vitest';
import i18n from '@/shared/config/i18n';
import { renderWithProviders, screen } from '@/test/utils';
import type { UpcomingGroup } from '@/entities/group/types';

const now = '2026-08-01T00:00:00.000Z';
const makeGroup = (over: Partial<UpcomingGroup>): UpcomingGroup => ({
  id: 'g',
  name: 'MS-XX',
  courseId: 'c',
  course: { id: 'c', slug: 's', title: { uz: 'Frontend', ru: 'Frontend', en: 'Frontend' } },
  teacher: null,
  startDate: '2026-09-02T00:00:00.000Z',
  endDate: null,
  weekDays: ['MON'],
  startTime: '18:00',
  endTime: '19:30',
  roomName: null,
  capacity: 12,
  activeStudentsCount: 12,
  freeSeats: 0,
  status: 'FORMING',
  createdAt: now,
  updatedAt: now,
  ...over,
});

vi.mock('@/entities/group/hooks', () => ({
  useUpcomingGroups: () => ({
    data: [
      makeGroup({ id: 'full', name: 'MS-BE07', freeSeats: 0 }),
      makeGroup({ id: 'open', name: 'MS-FS12', freeSeats: 2 }),
    ],
    isLoading: false,
    isError: false,
  }),
}));

const { MissionBoard } = await import('./MissionBoard');

describe('MissionBoard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('uz');
  });

  it('marks a full group as FULL and disables its row', () => {
    renderWithProviders(<MissionBoard />);
    expect(screen.getByText('FULL')).toBeInTheDocument();
    const fullRow = screen.getByText('MS-BE07').closest('button');
    expect(fullRow).toBeDisabled();
  });

  it('shows the free-seat count for an available group and keeps it clickable', () => {
    renderWithProviders(<MissionBoard />);
    expect(screen.getByText(/^2\s/)).toBeInTheDocument();
    const openRow = screen.getByText('MS-FS12').closest('button');
    expect(openRow).not.toBeDisabled();
  });
});
