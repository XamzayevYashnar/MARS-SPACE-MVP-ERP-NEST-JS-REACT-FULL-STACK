import { Paginated } from '../../../../common/interfaces';
import { CreatePostData, Post, PostQuery, UpdatePostData } from '../entities/post.entity';

export abstract class PostRepository {
  abstract findMany(query: PostQuery): Promise<Paginated<Post>>;
  abstract findById(id: string): Promise<Post | null>;
  abstract findBySlug(slug: string, publishedOnly: boolean): Promise<Post | null>;
  abstract existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreatePostData): Promise<Post>;
  abstract update(id: string, data: UpdatePostData): Promise<Post>;
  abstract delete(id: string): Promise<void>;
  /** Fire-and-forget counter bump (§6.3); never blocks the detail response. */
  abstract incrementViewCount(id: string): Promise<void>;
}
