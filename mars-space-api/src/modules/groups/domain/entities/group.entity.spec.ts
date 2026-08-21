import { GroupStatus, WeekDay } from '@prisma/client';
import { Group } from './group.entity';

function buildGroup(
  activeStudents: number,
  capacity = 15,
  status: GroupStatus = GroupStatus.ACTIVE,
): Group {
  return new Group(
    'group-1',
    'FS-2026-01',
    'course-1',
    null,
    new Date('2026-09-01'),
    null,
    [WeekDay.MON],
    '18:00',
    '19:30',
    null,
    capacity,
    status,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
    activeStudents,
  );
}

describe('Group', () => {
  describe('freeSeats', () => {
    it('is the capacity minus the active roster', () => {
      expect(buildGroup(11, 15).freeSeats()).toBe(4);
    });

    it('is zero for a full group', () => {
      expect(buildGroup(15, 15).freeSeats()).toBe(0);
    });

    it('never goes negative when the roster somehow exceeds the capacity', () => {
      expect(buildGroup(20, 15).freeSeats()).toBe(0);
    });
  });

  describe('isFull', () => {
    it('is true only when no seat is left', () => {
      expect(buildGroup(15, 15).isFull()).toBe(true);
      expect(buildGroup(14, 15).isFull()).toBe(false);
    });
  });

  describe('acceptsEnrolment', () => {
    it.each([[GroupStatus.FORMING], [GroupStatus.ACTIVE], [GroupStatus.PAUSED]])(
      'accepts into a %s group with free seats',
      (status) => {
        expect(buildGroup(1, 15, status).acceptsEnrolment()).toBe(true);
      },
    );

    it.each([[GroupStatus.FINISHED], [GroupStatus.CANCELLED]])(
      'refuses a %s group even with free seats',
      (status) => {
        expect(buildGroup(1, 15, status).acceptsEnrolment()).toBe(false);
      },
    );

    it('refuses a full group', () => {
      expect(buildGroup(15, 15).acceptsEnrolment()).toBe(false);
    });
  });

  describe('validateSchedule', () => {
    const start = new Date('2026-09-01');

    it('accepts a coherent schedule', () => {
      expect(Group.validateSchedule('18:00', '19:30', start, new Date('2027-03-01'))).toBeNull();
    });

    it('accepts an open-ended group', () => {
      expect(Group.validateSchedule('18:00', '19:30', start, null)).toBeNull();
    });

    it('rejects an end time at or before the start time', () => {
      expect(Group.validateSchedule('19:30', '18:00', start, null)).toBe(
        'endTime must be later than startTime',
      );
      expect(Group.validateSchedule('18:00', '18:00', start, null)).toBe(
        'endTime must be later than startTime',
      );
    });

    it('rejects an end date at or before the start date', () => {
      expect(Group.validateSchedule('18:00', '19:30', start, new Date('2026-08-01'))).toBe(
        'endDate must be later than startDate',
      );
      expect(Group.validateSchedule('18:00', '19:30', start, start)).toBe(
        'endDate must be later than startDate',
      );
    });
  });
});
