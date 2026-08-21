import { VIEW_COUNTER_TTL_MS } from '../../../common/constants/app.constants';
import { ViewCounterService } from './view-counter.service';

describe('ViewCounterService', () => {
  let service: ViewCounterService;

  beforeEach(() => {
    service = new ViewCounterService();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-01T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts a first view from an IP', () => {
    expect(service.shouldCount('post-1', '10.0.0.1')).toBe(true);
  });

  it('does not count a repeat view within the hour', () => {
    service.shouldCount('post-1', '10.0.0.1');

    expect(service.shouldCount('post-1', '10.0.0.1')).toBe(false);
  });

  it('counts again once the window has passed', () => {
    service.shouldCount('post-1', '10.0.0.1');

    jest.setSystemTime(new Date(Date.now() + VIEW_COUNTER_TTL_MS + 1000));

    expect(service.shouldCount('post-1', '10.0.0.1')).toBe(true);
  });

  it('tracks each post separately', () => {
    service.shouldCount('post-1', '10.0.0.1');

    expect(service.shouldCount('post-2', '10.0.0.1')).toBe(true);
  });

  it('tracks each IP separately', () => {
    service.shouldCount('post-1', '10.0.0.1');

    expect(service.shouldCount('post-1', '10.0.0.2')).toBe(true);
  });

  it('counts every view when the IP is unknown, rather than dropping them all', () => {
    expect(service.shouldCount('post-1', undefined)).toBe(true);
    expect(service.shouldCount('post-1', undefined)).toBe(true);
  });

  it('stays bounded under sustained unique traffic', () => {
    for (let index = 0; index < 12_000; index += 1) {
      service.shouldCount('post-1', `10.0.${Math.floor(index / 256)}.${index % 256}`);
    }

    const size = (service as unknown as { seen: Map<string, number> }).seen.size;
    expect(size).toBeLessThanOrEqual(10_000);
  });
});
