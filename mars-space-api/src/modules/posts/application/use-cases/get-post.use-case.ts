import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { PostRepository } from '../../domain/repositories/post.repository';
import { PostResponseDto } from '../dto/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class GetPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new EntityNotFoundException('Post', id);
    }

    return PostMapper.toResponse(post);
  }
}
