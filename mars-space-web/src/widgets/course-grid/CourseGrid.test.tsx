import { describe, expect, it, vi, beforeAll } from 'vitest';
import i18n from '@/shared/config/i18n';
import { renderWithProviders, screen } from '@/test/utils';
import { CourseGrid } from './CourseGrid';

describe('CourseGrid states', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('uz');
  });

  it('renders an empty state when there are no courses', () => {
    renderWithProviders(<CourseGrid courses={[]} isLoading={false} isError={false} />);
    expect(screen.getByText("Ma'lumot yo'q")).toBeInTheDocument();
  });

  it('renders an error state with a retry action', () => {
    const onRetry = vi.fn();
    renderWithProviders(<CourseGrid courses={undefined} isLoading={false} isError onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    screen.getByRole('button', { name: /qayta urinish/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
