import { describe, expect, it, beforeAll } from 'vitest';
import i18n from '@/shared/config/i18n';
import { renderWithProviders, screen } from '@/test/utils';
import { CourseCard } from './CourseCard';
import type { CourseCardData } from '../types';

const base: CourseCardData = {
  id: 'c1',
  slug: 'frontend',
  title: { uz: 'Frontend', ru: 'Frontend', en: 'Frontend' },
  shortDescription: { uz: 'Qisqa', ru: 'Кратко', en: 'Short' },
  level: 'BEGINNER',
  format: 'OFFLINE',
  durationMonths: 6,
  lessonsPerWeek: 3,
  totalLessons: 78,
  price: { amount: 1_800_000, discountAmount: 1_500_000, effectiveAmount: 1_500_000, discountPercent: 17, currency: 'UZS' },
  coverImageUrl: null,
  isFeatured: true,
  category: { id: 'cat', slug: 'fe', name: { uz: 'Frontend', ru: 'Frontend', en: 'Frontend' }, colorHex: null, iconKey: null },
  teachers: [{ id: 't1', slug: 'aziz', fullName: 'Aziz', position: { uz: '', ru: '', en: '' }, photoUrl: null }],
};

describe('CourseCard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('uz');
  });

  it('shows the effective price and strikes through the original when discounted', () => {
    renderWithProviders(<CourseCard course={base} />);
    expect(screen.getByText("1 500 000 so'm")).toBeInTheDocument();
    const original = screen.getByText("1 800 000 so'm");
    expect(original).toBeInTheDocument();
    expect(original.className).toContain('line-through');
  });

  it('renders the title and links to the detail page', () => {
    renderWithProviders(<CourseCard course={base} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/courses/frontend');
    expect(screen.getByRole('heading', { name: 'Frontend' })).toBeInTheDocument();
  });

  it('hides the strikethrough when there is no discount', () => {
    renderWithProviders(
      <CourseCard
        course={{ ...base, price: { ...base.price, discountAmount: null, effectiveAmount: 1_800_000, discountPercent: null } }}
      />,
    );
    expect(screen.queryByText("1 800 000 so'm")?.className ?? '').not.toContain('line-through');
  });
});
