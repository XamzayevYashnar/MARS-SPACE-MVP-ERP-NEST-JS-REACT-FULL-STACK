import { DomainException } from '../../../../common/exceptions';
import { CoursePrice } from './course-price.vo';

describe('CoursePrice', () => {
  describe('creation', () => {
    it('accepts a price without a discount', () => {
      const price = CoursePrice.create(1_800_000, null);

      expect(price.amount).toBe(1_800_000);
      expect(price.discountAmount).toBeNull();
      expect(price.currency).toBe('UZS');
    });

    it('accepts a discount below the price', () => {
      expect(CoursePrice.create(1_800_000, 1_500_000).discountAmount).toBe(1_500_000);
    });

    it('accepts a free course', () => {
      expect(CoursePrice.create(0, null).amount).toBe(0);
    });

    it('rejects a negative price', () => {
      expect(() => CoursePrice.create(-1, null)).toThrow(DomainException);
    });

    it('rejects a negative discount', () => {
      expect(() => CoursePrice.create(1000, -1)).toThrow(DomainException);
    });

    it('rejects a discount equal to the price', () => {
      expect(() => CoursePrice.create(1000, 1000)).toThrow(
        'Course discount price must be lower than the regular price',
      );
    });

    it('rejects a discount above the price', () => {
      expect(() => CoursePrice.create(1000, 2000)).toThrow(DomainException);
    });

    it('rejects a non-finite amount', () => {
      expect(() => CoursePrice.create(Number.NaN, null)).toThrow(DomainException);
      expect(() => CoursePrice.create(Number.POSITIVE_INFINITY, null)).toThrow(DomainException);
    });
  });

  describe('derived values', () => {
    it('charges the discount when there is one', () => {
      const price = CoursePrice.create(1_800_000, 1_500_000);

      expect(price.effectiveAmount()).toBe(1_500_000);
      expect(price.hasDiscount()).toBe(true);
    });

    it('charges the full price when there is none', () => {
      const price = CoursePrice.create(1_800_000, null);

      expect(price.effectiveAmount()).toBe(1_800_000);
      expect(price.hasDiscount()).toBe(false);
    });

    it('computes a whole-percent saving for the badge', () => {
      expect(CoursePrice.create(1_800_000, 1_500_000).discountPercent()).toBe(17);
      expect(CoursePrice.create(1000, 500).discountPercent()).toBe(50);
    });

    it('has no percentage without a discount', () => {
      expect(CoursePrice.create(1000, null).discountPercent()).toBeNull();
    });

    it('avoids dividing by zero on a free course', () => {
      expect(CoursePrice.create(0, null).discountPercent()).toBeNull();
    });

    it('keeps a custom currency', () => {
      expect(CoursePrice.create(100, null, 'USD').currency).toBe('USD');
    });
  });
});
