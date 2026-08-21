import { DomainException } from '../../../../common/exceptions';

/**
 * Price of a course, with its optional discount.
 *
 * This earns a value object because the three fields only make sense together:
 * a discount above the base price, or a negative amount, is not a valid price
 * at all — and the "what does the customer actually pay" question has exactly
 * one answer, which belongs here rather than in every consumer.
 */
export class CoursePrice {
  private constructor(
    readonly amount: number,
    readonly discountAmount: number | null,
    readonly currency: string,
  ) {}

  static create(amount: number, discountAmount: number | null, currency = 'UZS'): CoursePrice {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainException('Course price must be a non-negative number');
    }

    if (discountAmount !== null) {
      if (!Number.isFinite(discountAmount) || discountAmount < 0) {
        throw new DomainException('Course discount price must be a non-negative number');
      }
      if (discountAmount >= amount) {
        throw new DomainException('Course discount price must be lower than the regular price');
      }
    }

    return new CoursePrice(amount, discountAmount, currency);
  }

  /** What the student actually pays today. */
  effectiveAmount(): number {
    return this.discountAmount ?? this.amount;
  }

  hasDiscount(): boolean {
    return this.discountAmount !== null;
  }

  /** Whole-percent saving, for the "-17%" badge on the course card. */
  discountPercent(): number | null {
    if (this.discountAmount === null || this.amount === 0) {
      return null;
    }
    return Math.round(((this.amount - this.discountAmount) / this.amount) * 100);
  }
}
