import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { PostRepository } from '../../domain/repositories/post.repository';

@Injectable()
export class DeletePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.postRepository.findById(id))) {
      throw new EntityNotFoundException('Post', id);
    }

    await this.postRepository.delete(id);
  }
}
