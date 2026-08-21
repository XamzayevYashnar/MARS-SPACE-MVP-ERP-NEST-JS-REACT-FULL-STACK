import { Injectable } from '@nestjs/common';
import { ReorderDto } from '../../../../common/dto/reorder.dto';
import { CategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class ReorderCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * Applies a whole new ordering in one transaction, so a half-applied drag
   * never leaves the public menu in a scrambled state.
   */
  async execute(dto: ReorderDto): Promise<void> {
    await this.categoryRepository.reorder(dto.items);
  }
}
