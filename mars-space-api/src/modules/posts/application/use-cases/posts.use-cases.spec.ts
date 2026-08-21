import { Language } from '../../../../common/enums/language.enum';
import {
  BusinessRuleException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { Post } from '../../domain/entities/post.entity';
import { PostRepository } from '../../domain/repositories/post.repository';
import { ViewCounterService } from '../../infrastructure/view-counter.service';
import { CreatePostUseCase } from './create-post.use-case';
import { DeletePostUseCase } from './delete-post.use-case';
import { GetPostBySlugUseCase } from './get-post-by-slug.use-case';
import { GetPostUseCase } from './get-post.use-case';
import { ListPostsUseCase } from './list-posts.use-case';
import { PublishPostUseCase } from './publish-post.use-case';
import { UpdatePostUseCase } from './update-post.use-case';

function buildPost(overrides: Partial<Post> = {}): Post {
  // `??` would swallow an explicit null, and `publishedAt: null` is exactly the
  // state these tests need to set up.
  const publishedAt =
    'publishedAt' in overrides ? (overrides.publishedAt ?? null) : new Date('2026-08-01');

  return new Post(
    overrides.id ?? 'post-1',
    overrides.slug ?? 'frontend-yol-xaritasi',
    overrides.title ?? { uz: 'Yoʻl xaritasi', ru: 'Дорожная карта', en: 'Roadmap' },
    overrides.excerpt ?? { uz: 'Qisqacha', ru: 'Кратко', en: 'Short' },
    overrides.content ?? { uz: '<p>Matn</p>', ru: '', en: '' },
    overrides.coverImageUrl ?? null,
    overrides.tags ?? ['frontend'],
    overrides.authorId ?? 'user-1',
    overrides.readMinutes ?? 5,
    overrides.viewCount ?? 12,
    overrides.metaTitle ?? null,
    overrides.metaDescription ?? null,
    overrides.isPublished ?? true,
    publishedAt,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

function buildRepository(): jest.Mocked<PostRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildPost()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildPost()),
    findBySlug: jest.fn().mockResolvedValue(buildPost()),
    existsBySlug: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockImplementation(async (data) => buildPost({ slug: data.slug })),
    update: jest.fn().mockResolvedValue(buildPost()),
    delete: jest.fn().mockResolvedValue(undefined),
    incrementViewCount: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<PostRepository>;
}

const baseDto = {
  title: { uz: 'Frontend yoʻl xaritasi' },
  excerpt: { uz: 'Qisqacha' },
  content: { uz: '<p>Matn</p>' },
};

describe('CreatePostUseCase', () => {
  let repository: jest.Mocked<PostRepository>;
  let useCase: CreatePostUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new CreatePostUseCase(repository);
  });

  it('derives the slug from title.uz and records the author', async () => {
    const result = await useCase.execute(baseDto, 'user-42');

    expect(result.slug).toBe('frontend-yol-xaritasi');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'user-42' }),
    );
  });

  it('leaves publishedAt unset for a draft', async () => {
    await useCase.execute(baseDto, 'user-1');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: false, publishedAt: null }),
    );
  });

  it('stamps publishedAt when created already published', async () => {
    await useCase.execute({ ...baseDto, isPublished: true }, 'user-1');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true, publishedAt: expect.any(Date) }),
    );
  });

  it('sanitises the body but strips the excerpt', async () => {
    await useCase.execute(
      {
        ...baseDto,
        content: { uz: '<p>Yaxshi</p><script>x</script>' },
        excerpt: { uz: '<b>Qisqacha</b>' },
      },
      'user-1',
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ uz: '<p>Yaxshi</p>' }),
        excerpt: expect.objectContaining({ uz: 'Qisqacha' }),
      }),
    );
  });

  it('normalises tags to slugs and removes duplicates', async () => {
    await useCase.execute({ ...baseDto, tags: ['Frontend', 'frontend', 'Web Dev'] }, 'user-1');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['frontend', 'web-dev'] }),
    );
  });

  it('rejects an explicit slug that is taken', async () => {
    repository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute({ ...baseDto, slug: 'taken' }, 'user-1')).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });
});

describe('UpdatePostUseCase', () => {
  let repository: jest.Mocked<PostRepository>;
  let useCase: UpdatePostUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new UpdatePostUseCase(repository);
  });

  it('404s on an unknown post', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { readMinutes: 7 })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('stamps publishedAt the first time a draft goes live', async () => {
    repository.findById.mockResolvedValue(buildPost({ isPublished: false, publishedAt: null }));

    await useCase.execute('post-1', { isPublished: true });

    expect(repository.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ publishedAt: expect.any(Date) }),
    );
  });

  it('leaves an existing publishedAt alone on a later edit', async () => {
    repository.findById.mockResolvedValue(buildPost({ publishedAt: new Date('2026-01-05') }));

    await useCase.execute('post-1', { isPublished: true });

    expect(repository.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ publishedAt: undefined }),
    );
  });

  it('clears publishedAt when the post is unpublished', async () => {
    await useCase.execute('post-1', { isPublished: false });

    expect(repository.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ publishedAt: null }),
    );
  });
});

describe('PublishPostUseCase', () => {
  let repository: jest.Mocked<PostRepository>;
  let useCase: PublishPostUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new PublishPostUseCase(repository);
  });

  it('refuses to publish a post with no Uzbek body', async () => {
    repository.findById.mockResolvedValue(buildPost({ content: { uz: '  ', ru: '', en: '' } }));

    await expect(useCase.execute('post-1', true)).rejects.toThrow(BusinessRuleException);
  });

  it('stamps publishedAt only on the first publication', async () => {
    repository.findById.mockResolvedValue(buildPost({ isPublished: false, publishedAt: null }));

    await useCase.execute('post-1', true);

    expect(repository.update).toHaveBeenCalledWith('post-1', {
      isPublished: true,
      publishedAt: expect.any(Date),
    });
  });

  it('keeps the original date when re-publishing', async () => {
    repository.findById.mockResolvedValue(buildPost({ publishedAt: new Date('2026-01-05') }));

    await useCase.execute('post-1', true);

    expect(repository.update).toHaveBeenCalledWith('post-1', { isPublished: true });
  });

  it('clears publishedAt on unpublish', async () => {
    await useCase.execute('post-1', false);

    expect(repository.update).toHaveBeenCalledWith('post-1', {
      isPublished: false,
      publishedAt: null,
    });
  });

  it('404s on an unknown post', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', true)).rejects.toThrow(EntityNotFoundException);
  });
});

describe('GetPostBySlugUseCase', () => {
  let repository: jest.Mocked<PostRepository>;
  let viewCounter: jest.Mocked<ViewCounterService>;
  let useCase: GetPostBySlugUseCase;

  beforeEach(() => {
    repository = buildRepository();
    viewCounter = {
      shouldCount: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<ViewCounterService>;
    useCase = new GetPostBySlugUseCase(repository, viewCounter);
  });

  it('restricts the lookup to published posts', async () => {
    await useCase.execute('frontend-yol-xaritasi');

    expect(repository.findBySlug).toHaveBeenCalledWith('frontend-yol-xaritasi', true);
  });

  it('404s on a draft slug', async () => {
    repository.findBySlug.mockResolvedValue(null);

    await expect(useCase.execute('draft-post')).rejects.toThrow(EntityNotFoundException);
  });

  it('increments the counter for a first-time reader', async () => {
    await useCase.execute('frontend-yol-xaritasi', undefined, '10.0.0.1');

    expect(viewCounter.shouldCount).toHaveBeenCalledWith('post-1', '10.0.0.1');
    expect(repository.incrementViewCount).toHaveBeenCalledWith('post-1');
  });

  it('skips the counter for a repeat reader', async () => {
    viewCounter.shouldCount.mockReturnValue(false);

    await useCase.execute('frontend-yol-xaritasi', undefined, '10.0.0.1');

    expect(repository.incrementViewCount).not.toHaveBeenCalled();
  });

  it('still returns the post when the counter write fails', async () => {
    repository.incrementViewCount.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute('frontend-yol-xaritasi')).resolves.toMatchObject({
      slug: 'frontend-yol-xaritasi',
    });
  });

  it('flattens localised fields for the requested language', async () => {
    const result = await useCase.execute('frontend-yol-xaritasi', Language.RU);

    expect(result.title).toBe('Дорожная карта');
  });
});

describe('ListPostsUseCase', () => {
  let repository: jest.Mocked<PostRepository>;
  let useCase: ListPostsUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new ListPostsUseCase(repository);
  });

  it('forces isPublished on the public listing', async () => {
    await useCase.executePublic({ tag: 'karyera' });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true, tag: 'karyera', sortBy: 'publishedAt' }),
    );
  });

  it('lets the admin listing ask for drafts', async () => {
    await useCase.execute({ isPublished: false });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: false }),
    );
  });
});

describe('GetPostUseCase and DeletePostUseCase', () => {
  it('reads a post by id', async () => {
    const repository = buildRepository();

    await expect(new GetPostUseCase(repository).execute('post-1')).resolves.toMatchObject({
      id: 'post-1',
    });
  });

  it('404s on an unknown id', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new GetPostUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('deletes a post', async () => {
    const repository = buildRepository();

    await new DeletePostUseCase(repository).execute('post-1');

    expect(repository.delete).toHaveBeenCalledWith('post-1');
  });

  it('404s when deleting an unknown post', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new DeletePostUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});
