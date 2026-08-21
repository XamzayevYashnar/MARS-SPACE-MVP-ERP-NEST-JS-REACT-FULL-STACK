import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { LanguageQueryDto, SlugParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import { PostResponseDto, QueryPublicPostsDto } from '../application/dto/post.dto';
import { GetPostBySlugUseCase } from '../application/use-cases/get-post-by-slug.use-case';
import { ListPostsUseCase } from '../application/use-cases/list-posts.use-case';

@ApiTags('Public')
@Public()
@Controller('posts')
export class PostsController {
  constructor(
    private readonly listPosts: ListPostsUseCase,
    private readonly getPostBySlug: GetPostBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Published posts; filter by tag or search' })
  @ApiOkPaginated(PostResponseDto)
  list(@Query() query: QueryPublicPostsDto): Promise<Paginated<PostResponseDto>> {
    return this.listPosts.executePublic(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Post detail',
    description:
      'Increments viewCount at most once per IP per hour, without blocking the response.',
  })
  @ApiOkEnvelope(PostResponseDto)
  getOne(
    @Param() { slug }: SlugParamDto,
    @Query() { lang }: LanguageQueryDto,
    @Req() request: Request,
  ): Promise<PostResponseDto> {
    return this.getPostBySlug.execute(slug, lang, request.ip);
  }
}
