import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { CurrentUser, Roles } from '../../../common/decorators/auth.decorators';
import { IdParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import {
  CreatePostDto,
  PostResponseDto,
  PublishPostDto,
  QueryPostsDto,
  UpdatePostDto,
} from '../application/dto/post.dto';
import { CreatePostUseCase } from '../application/use-cases/create-post.use-case';
import { DeletePostUseCase } from '../application/use-cases/delete-post.use-case';
import { GetPostUseCase } from '../application/use-cases/get-post.use-case';
import { ListPostsUseCase } from '../application/use-cases/list-posts.use-case';
import { PublishPostUseCase } from '../application/use-cases/publish-post.use-case';
import { UpdatePostUseCase } from '../application/use-cases/update-post.use-case';

@ApiTags('Admin: Posts')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/posts')
export class PostsAdminController {
  constructor(
    private readonly listPosts: ListPostsUseCase,
    private readonly getPost: GetPostUseCase,
    private readonly createPost: CreatePostUseCase,
    private readonly updatePost: UpdatePostUseCase,
    private readonly publishPost: PublishPostUseCase,
    private readonly deletePost: DeletePostUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every post, drafts included' })
  @ApiOkPaginated(PostResponseDto)
  list(@Query() query: QueryPostsDto): Promise<Paginated<PostResponseDto>> {
    return this.listPosts.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post; the caller becomes its author' })
  @ApiOkEnvelope(PostResponseDto)
  create(
    @Body() dto: CreatePostDto,
    @CurrentUser('id') authorId: string,
  ): Promise<PostResponseDto> {
    return this.createPost.execute(dto, authorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one post' })
  @ApiOkEnvelope(PostResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<PostResponseDto> {
    return this.getPost.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiOkEnvelope(PostResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdatePostDto): Promise<PostResponseDto> {
    return this.updatePost.execute(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a post' })
  @ApiOkEnvelope(PostResponseDto)
  publish(@Param() { id }: IdParamDto, @Body() dto: PublishPostDto): Promise<PostResponseDto> {
    return this.publishPost.execute(id, dto.isPublished);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deletePost.execute(id);
  }
}
