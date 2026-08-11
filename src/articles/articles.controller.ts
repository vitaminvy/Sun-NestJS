import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ArticlesService } from './articles.service';
import {
  ArticleResponseDto,
  ArticlesResponseDto,
} from './dto/article-response.dto';
import {
  CommentResponseDto,
  CommentsResponseDto,
  DeleteCommentResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentRequestDto } from './dto/create-comment.dto';
import { CreateArticleRequestDto } from './dto/create-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { UpdateArticleRequestDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create article' })
  @ApiBody({ type: CreateArticleRequestDto })
  @ApiCreatedResponse({ type: ArticleResponseDto })
  createArticle(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: CreateArticleRequestDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.createArticle(currentUser.sub, body.article);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Feed articles' })
  @ApiOkResponse({ type: ArticlesResponseDto })
  feedArticles(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListArticlesQueryDto,
  ): Promise<ArticlesResponseDto> {
    return this.articlesService.feedArticles(currentUser.sub, query);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List articles' })
  @ApiOkResponse({ type: ArticlesResponseDto })
  listArticles(
    @Query() query: ListArticlesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ArticlesResponseDto> {
    return this.articlesService.listArticles(query, request.user?.sub);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get article' })
  @ApiOkResponse({ type: ArticleResponseDto })
  getArticle(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.getArticle(slug, request.user?.sub);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update article' })
  @ApiBody({ type: UpdateArticleRequestDto })
  @ApiOkResponse({ type: ArticleResponseDto })
  updateArticle(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: UpdateArticleRequestDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.updateArticle(slug, currentUser.sub, body);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete article' })
  deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<void> {
    return this.articlesService.deleteArticle(slug, currentUser.sub);
  }

  @Post(':slug/favorite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Favorite article' })
  @ApiOkResponse({ type: ArticleResponseDto })
  favoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.favoriteArticle(slug, currentUser.sub);
  }

  @Delete(':slug/favorite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfavorite article' })
  @ApiOkResponse({ type: ArticleResponseDto })
  unfavoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.unfavoriteArticle(slug, currentUser.sub);
  }

  @Post(':slug/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add comment to article' })
  @ApiBody({ type: CreateCommentRequestDto })
  @ApiCreatedResponse({ type: CommentResponseDto })
  addComment(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: CreateCommentRequestDto,
  ): Promise<CommentResponseDto> {
    return this.articlesService.addComment(slug, currentUser.sub, body.comment);
  }

  @Get(':slug/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get comments from article' })
  @ApiOkResponse({ type: CommentsResponseDto })
  getComments(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<CommentsResponseDto> {
    return this.articlesService.getComments(slug, request.user?.sub);
  }

  @Delete(':slug/comments/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiOkResponse({ type: DeleteCommentResponseDto })
  deleteComment(
    @Param('slug') slug: string,
    @Param('id') commentId: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<DeleteCommentResponseDto> {
    return this.articlesService.deleteComment(slug, commentId, currentUser.sub);
  }
}
