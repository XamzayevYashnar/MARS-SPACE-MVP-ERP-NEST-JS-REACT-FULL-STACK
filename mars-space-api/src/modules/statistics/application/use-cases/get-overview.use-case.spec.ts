import { LeadRepository } from '../../../leads/domain/repositories/lead.repository';
import { StatisticsRepository } from '../../domain/repositories/statistics.repository';
import { GetOverviewUseCase } from './get-overview.use-case';

describe('GetOverviewUseCase', () => {
  let statisticsRepository: jest.Mocked<StatisticsRepository>;
  let leadRepository: jest.Mocked<LeadRepository>;
  let useCase: GetOverviewUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-19T10:00:00'));

    statisticsRepository = {
      entityTotals: jest
        .fn()
        .mockResolvedValue({ publishedCourses: 12, activeGroups: 7, activeStudents: 143 }),
    } as unknown as jest.Mocked<StatisticsRepository>;

    leadRepository = {
      countByStatus: jest.fn().mockResolvedValue({
        NEW: 14,
        IN_PROGRESS: 9,
        CONTACTED: 21,
        ENROLLED: 12,
        REJECTED: 5,
      }),
      countSince: jest.fn().mockResolvedValue(61),
      trend: jest.fn().mockResolvedValue([{ date: '2026-08-19', count: 4 }]),
      topCourses: jest
        .fn()
        .mockResolvedValue([
          { courseId: 'course-1', title: { uz: 'Frontend', ru: '', en: '' }, leadsCount: 23 },
        ]),
      recent: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<LeadRepository>;

    useCase = new GetOverviewUseCase(statisticsRepository, leadRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('assembles the documented dashboard payload', async () => {
    const result = await useCase.execute();

    expect(result.totals).toEqual({
      courses: 12,
      activeGroups: 7,
      students: 143,
      leadsThisMonth: 61,
    });
    expect(result.leadsByStatus.CONTACTED).toBe(21);
    expect(result.topCourses[0]).toMatchObject({ courseId: 'course-1', leadsCount: 23 });
  });

  it('counts this month from the first of the month', async () => {
    await useCase.execute();

    const since = leadRepository.countSince.mock.calls[0][0];
    expect(since.getDate()).toBe(1);
    expect(since.getMonth()).toBe(7); // August
    expect(since.getHours()).toBe(0);
  });

  it('fills the trend with zero-count days, so the chart is a continuous line', async () => {
    const result = await useCase.execute();

    expect(result.leadsTrend).toHaveLength(30);
    expect(result.leadsTrend[29]).toEqual({ date: '2026-08-19', count: 4 });
    // A day the repository returned nothing for still appears, as a zero.
    expect(result.leadsTrend[0]).toEqual({ date: '2026-07-21', count: 0 });
  });

  it('asks for a 30-day window starting at local midnight', async () => {
    await useCase.execute();

    // Asserted in local calendar terms: the buckets have to line up with
    // Postgres `date_trunc`, which also works in the server's local day.
    const since = leadRepository.trend.mock.calls[0][0];
    expect([since.getFullYear(), since.getMonth() + 1, since.getDate()]).toEqual([2026, 7, 21]);
    expect(since.getHours()).toBe(0);
  });

  it('runs the aggregate queries concurrently rather than in a chain', async () => {
    const order: string[] = [];
    statisticsRepository.entityTotals.mockImplementation(async () => {
      order.push('totals');
      return { publishedCourses: 1, activeGroups: 1, activeStudents: 1 };
    });
    leadRepository.countByStatus.mockImplementation(async () => {
      order.push('status');
      return { NEW: 0, IN_PROGRESS: 0, CONTACTED: 0, ENROLLED: 0, REJECTED: 0 };
    });

    await useCase.execute();

    // Both started before either awaited result was consumed.
    expect(order).toEqual(['totals', 'status']);
  });
});
