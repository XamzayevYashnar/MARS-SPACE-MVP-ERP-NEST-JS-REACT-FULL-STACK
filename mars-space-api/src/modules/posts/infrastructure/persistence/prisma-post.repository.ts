import { Injectable } from '@nestjs/common';
import { Post as PrismaPost, Prisma } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import {
  toJsonInput,
  toLocalizedText,
  toNullableJsonInput,
  toOptionalLocalizedText,
} from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import { CreatePostData, Post, PostQuery, UpdatePostData } from '../../domain/entities/post.entity';
import { PostRepository } from '../../domain/repositories/post.repository';

const POST_INCLUDE = {
  author: { select: { id: true, fullName: true, avatarUrl: true } },
} satisfies Prisma.PostInclude;

type PostRow = PrismaPost & {
  author?: { id: string; fullName: string; avatarUrl: string | null } | null;
};

@Injectable()
export class PrismaPostRepository extends BasePrismaRepository implements PostRepository {
  protected readonly sortableColumns = [
    'publishedAt',
    'createdAt',
    'updatedAt',
    'viewCount',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: PostQuery): Promise<Paginated<Post>> {
    const where: Prisma.PostWhereInput = {
      ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.search
        ? {
            OR: [
              { slug: this.containsInsensitive(query.search) },
              ...this.localizedContains('title', query.search),
              ...this.localizedContains('excerpt', query.search),
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.post.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: POST_INCLUDE,
      }),
      this.prisma.post.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Post | null> {
    const row = await this.prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string, publishedOnly: boolean): Promise<Post | null> {
    const row = await this.prisma.post.findFirst({
      where: { slug, ...(publishedOnly ? { isPublished: true } : {}) },
      include: POST_INCLUDE,
    });
    return row ? toDomain(row) : null;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.post.count({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreatePostData): Promise<Post> {
    const row = await this.prisma.post.create({
      data: {
        slug: data.slug,
        title: toJsonInput(data.title),
        excerpt: toJsonInput(data.excerpt),
        content: toJsonInput(data.content),
        coverImageUrl: data.coverImageUrl ?? null,
        tags: data.tags ?? [],
        authorId: data.authorId ?? null,
        readMinutes: data.readMinutes ?? 3,
        metaTitle: toNullableJsonInput(data.metaTitle),
        metaDescription: toNullableJsonInput(data.metaDescription),
        isPublished: data.isPublished ?? false,
        publishedAt: data.publishedAt ?? null,
      },
      include: POST_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdatePostData): Promise<Post> {
    const row = await this.prisma.post.update({
      where: { id },
      data: {
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: toJsonInput(data.title) } : {}),
        ...(data.excerpt !== undefined ? { excerpt: toJsonInput(data.excerpt) } : {}),
        ...(data.content !== undefined ? { content: toJsonInput(data.content) } : {}),
        ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.readMinutes !== undefined ? { readMinutes: data.readMinutes } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: toNullableJsonInput(data.metaTitle) } : {}),
        ...(data.metaDescription !== undefined
          ? { metaDescription: toNullableJsonInput(data.metaDescription) }
          : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
      },
      include: POST_INCLUDE,
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async incrementViewCount(id: string): Promise<void> {
    // `updateMany` rather than `update`: a post deleted between the read and
    // this write should be a no-op, not a P2025.
    await this.prisma.post.updateMany({ where: { id }, data: { viewCount: { increment: 1 } } });
  }
}

function toDomain(row: PostRow): Post {
  return new Post(
    row.id,
    row.slug,
    toLocalizedText(row.title),
    toLocalizedText(row.excerpt),
    toLocalizedText(row.content),
    row.coverImageUrl,
    row.tags,
    row.authorId,
    row.readMinutes,
    row.viewCount,
    toOptionalLocalizedText(row.metaTitle),
    toOptionalLocalizedText(row.metaDescription),
    row.isPublished,
    row.publishedAt,
    row.createdAt,
    row.updatedAt,
    row.author
      ? { id: row.author.id, fullName: row.author.fullName, avatarUrl: row.author.avatarUrl }
      : null,
  );
}
