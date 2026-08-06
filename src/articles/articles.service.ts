import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { UserEntity } from '../users/entities/user.entity';
import {
  ArticleFavoriteCountRow,
  ArticleIdRow,
  ArticlesRepository,
  AuthorIdRow,
} from './articles.repository';
import {
  ArticleResponseDataDto,
  ArticleResponseDto,
  ArticlesResponseDto,
} from './dto/article-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import {
  UpdateArticleDto,
  UpdateArticleRequestDto,
} from './dto/update-article.dto';
import { ArticleTagEntity } from './entities/article-tag.entity';
import { ArticleEntity } from './entities/article.entity';

interface ArticleStore {
  addFavorite(articleId: number, userId: number): Promise<void>;
  createArticle(articleData: {
    title: string;
    description: string;
    body: string;
    slug: string;
    author: UserEntity;
    tags: ArticleTagEntity[];
  }): ArticleEntity;
  createTag(tagName: string): ArticleTagEntity;
  findArticleBySlug(slug: string): Promise<ArticleEntity | null>;
  findArticles(
    query: ListArticlesQueryDto,
    limit: number,
    offset: number,
  ): Promise<[ArticleEntity[], number]>;
  findFavoriteCounts(articleIds: number[]): Promise<ArticleFavoriteCountRow[]>;
  findFavoritedArticleIds(
    articleIds: number[],
    currentUserId: number,
  ): Promise<ArticleIdRow[]>;
  findFeedArticles(
    currentUserId: number,
    limit: number,
    offset: number,
  ): Promise<[ArticleEntity[], number]>;
  findFollowingAuthorIds(
    authorIds: number[],
    currentUserId: number,
  ): Promise<AuthorIdRow[]>;
  findTagByName(tagName: string): Promise<ArticleTagEntity | null>;
  findUserById(userId: number): Promise<UserEntity | null>;
  isArticleFavoritedByUser(articleId: number, userId: number): Promise<boolean>;
  removeArticle(article: ArticleEntity): Promise<void>;
  removeFavorite(articleId: number, userId: number): Promise<void>;
  saveArticle(article: ArticleEntity): Promise<ArticleEntity>;
  saveTag(tag: ArticleTagEntity): Promise<ArticleTagEntity>;
  slugExists(slug: string, articleIdToIgnore?: number): Promise<boolean>;
}

interface ArticleFavoriteStats {
  favorited: boolean;
  favoritesCount: number;
}

interface TranslationService {
  t(key: string): string;
}

@Injectable()
export class ArticlesService {
  private readonly defaultLimit = 20;

  constructor(
    @Inject(ArticlesRepository)
    private readonly articlesRepository: ArticleStore,

    @Inject(I18nService)
    private readonly i18nService: TranslationService,
  ) {}

  async createArticle(
    currentUserId: number,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    const author = await this.findAuthenticatedUser(currentUserId);
    const title = createArticleDto.title.trim();
    const article = this.articlesRepository.createArticle({
      title,
      description: createArticleDto.description.trim(),
      body: createArticleDto.body.trim(),
      slug: await this.createUniqueSlug(title),
      author,
      tags: await this.findOrCreateTags(createArticleDto.tagList),
    });

    const savedArticle = await this.articlesRepository.saveArticle(article);

    return this.buildArticleResponse(savedArticle, currentUserId);
  }

  async listArticles(
    query: ListArticlesQueryDto,
    currentUserId?: number,
  ): Promise<ArticlesResponseDto> {
    const { limit, offset } = this.normalizePagination(query);
    const [articles, articlesCount] =
      await this.articlesRepository.findArticles(query, limit, offset);

    return this.buildArticlesResponse(articles, articlesCount, currentUserId);
  }

  async feedArticles(
    currentUserId: number,
    query: ListArticlesQueryDto,
  ): Promise<ArticlesResponseDto> {
    await this.findAuthenticatedUser(currentUserId);

    const { limit, offset } = this.normalizePagination(query);
    const [articles, articlesCount] =
      await this.articlesRepository.findFeedArticles(
        currentUserId,
        limit,
        offset,
      );

    return this.buildArticlesResponse(articles, articlesCount, currentUserId);
  }

  async getArticle(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.findArticleBySlug(slug);

    return this.buildArticleResponse(article, currentUserId);
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateArticleBody: UpdateArticleRequestDto,
  ): Promise<ArticleResponseDto> {
    await this.findAuthenticatedUser(currentUserId);

    const article = await this.findArticleBySlug(slug);

    this.assertCanManageArticle(article, currentUserId);

    const updateArticleDto = this.normalizeUpdateArticleDto(updateArticleBody);

    if (updateArticleDto.title !== undefined) {
      const title = updateArticleDto.title.trim();
      article.title = title;
      article.slug = await this.createUniqueSlug(title, article.id);
    }

    if (updateArticleDto.description !== undefined) {
      article.description = updateArticleDto.description.trim();
    }

    if (updateArticleDto.body !== undefined) {
      article.body = updateArticleDto.body.trim();
    }

    if (updateArticleDto.tagList !== undefined) {
      article.tags = await this.findOrCreateTags(updateArticleDto.tagList);
    }

    const savedArticle = await this.articlesRepository.saveArticle(article);

    return this.buildArticleResponse(savedArticle, currentUserId);
  }

  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    await this.findAuthenticatedUser(currentUserId);

    const article = await this.findArticleBySlug(slug);

    this.assertCanManageArticle(article, currentUserId);

    await this.articlesRepository.removeArticle(article);
  }

  async favoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const [article, currentUser] = await Promise.all([
      this.findArticleBySlug(slug),
      this.findAuthenticatedUser(currentUserId),
    ]);
    const isFavorited = await this.isArticleFavoritedByUser(
      article.id,
      currentUser.id,
    );

    if (!isFavorited) {
      await this.articlesRepository.addFavorite(article.id, currentUser.id);
    }

    return this.getArticle(slug, currentUserId);
  }

  async unfavoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const [article, currentUser] = await Promise.all([
      this.findArticleBySlug(slug),
      this.findAuthenticatedUser(currentUserId),
    ]);

    await this.articlesRepository.removeFavorite(article.id, currentUser.id);

    return this.getArticle(slug, currentUserId);
  }

  private async findAuthenticatedUser(userId: number): Promise<UserEntity> {
    const user = await this.articlesRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException(
        this.i18nService.t('translation.AUTH.ERRORS.UNAUTHORIZED'),
      );
    }

    return user;
  }

  private async findArticleBySlug(slug: string): Promise<ArticleEntity> {
    const article = await this.articlesRepository.findArticleBySlug(slug);

    if (!article) {
      throw new NotFoundException(
        this.i18nService.t('translation.ARTICLES.ERRORS.NOT_FOUND'),
      );
    }

    return article;
  }

  private assertCanManageArticle(
    article: ArticleEntity,
    currentUserId: number,
  ): void {
    if (article.author.id !== currentUserId) {
      throw new ForbiddenException(
        this.i18nService.t('translation.ARTICLES.ERRORS.FORBIDDEN'),
      );
    }
  }

  private normalizeUpdateArticleDto(
    updateArticleBody?: UpdateArticleRequestDto,
  ): UpdateArticleDto {
    return updateArticleBody?.article ?? {};
  }

  private normalizePagination(query: ListArticlesQueryDto): {
    limit: number;
    offset: number;
  } {
    return {
      limit: query.limit ?? this.defaultLimit,
      offset: query.offset ?? 0,
    };
  }

  private async findOrCreateTags(
    tagList: string[] = [],
  ): Promise<ArticleTagEntity[]> {
    const tagNames = this.normalizeTagList(tagList);
    const tags: ArticleTagEntity[] = [];

    for (const tagName of tagNames) {
      tags.push(await this.findOrCreateTag(tagName));
    }

    return tags;
  }

  private async findOrCreateTag(tagName: string): Promise<ArticleTagEntity> {
    const existingTag = await this.articlesRepository.findTagByName(tagName);

    if (existingTag) {
      return existingTag;
    }

    const tag = this.articlesRepository.createTag(tagName);

    return this.articlesRepository.saveTag(tag);
  }

  private normalizeTagList(tagList: string[]): string[] {
    const normalizedTags = new Map<string, string>();

    for (const tag of tagList) {
      const trimmedTag = tag.trim();

      if (!trimmedTag) {
        continue;
      }

      normalizedTags.set(trimmedTag.toLowerCase(), trimmedTag);
    }

    return [...normalizedTags.values()];
  }

  private async createUniqueSlug(
    title: string,
    articleIdToIgnore?: number,
  ): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.slugExists(slug, articleIdToIgnore)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async slugExists(
    slug: string,
    articleIdToIgnore?: number,
  ): Promise<boolean> {
    return this.articlesRepository.slugExists(slug, articleIdToIgnore);
  }

  private slugify(title: string): string {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'article';
  }

  private async isArticleFavoritedByUser(
    articleId: number,
    userId: number,
  ): Promise<boolean> {
    return this.articlesRepository.isArticleFavoritedByUser(articleId, userId);
  }

  private async buildArticleResponse(
    article: ArticleEntity,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    const favoriteStats = await this.getFavoriteStats(
      [article.id],
      currentUserId,
    );
    const followingAuthorIds = await this.getFollowingAuthorIds(
      [article.author.id],
      currentUserId,
    );
    const stats = favoriteStats.get(article.id) ?? {
      favorited: false,
      favoritesCount: 0,
    };

    return new ArticleResponseDto(
      article,
      stats.favorited,
      stats.favoritesCount,
      followingAuthorIds.has(article.author.id),
    );
  }

  private async buildArticlesResponse(
    articles: ArticleEntity[],
    articlesCount: number,
    currentUserId?: number,
  ): Promise<ArticlesResponseDto> {
    if (articles.length === 0) {
      return new ArticlesResponseDto([], articlesCount);
    }

    const articleIds = articles.map((article) => article.id);
    const authorIds = [
      ...new Set(articles.map((article) => article.author.id)),
    ];
    const [favoriteStats, followingAuthorIds] = await Promise.all([
      this.getFavoriteStats(articleIds, currentUserId),
      this.getFollowingAuthorIds(authorIds, currentUserId),
    ]);
    const articleDtos = articles.map((article) => {
      const stats = favoriteStats.get(article.id) ?? {
        favorited: false,
        favoritesCount: 0,
      };

      return new ArticleResponseDataDto(
        article,
        stats.favorited,
        stats.favoritesCount,
        followingAuthorIds.has(article.author.id),
      );
    });

    return new ArticlesResponseDto(articleDtos, articlesCount);
  }

  private async getFavoriteStats(
    articleIds: number[],
    currentUserId?: number,
  ): Promise<Map<number, ArticleFavoriteStats>> {
    const favoriteStats = new Map<number, ArticleFavoriteStats>(
      articleIds.map((articleId) => [
        articleId,
        {
          favorited: false,
          favoritesCount: 0,
        },
      ]),
    );

    if (articleIds.length === 0) {
      return favoriteStats;
    }

    const favoriteCountRows =
      await this.articlesRepository.findFavoriteCounts(articleIds);

    for (const row of favoriteCountRows) {
      const articleId = Number(row.articleId);
      const stats = favoriteStats.get(articleId);

      if (stats) {
        stats.favoritesCount = Number(row.favoritesCount);
      }
    }

    if (!currentUserId) {
      return favoriteStats;
    }

    const favoritedRows = await this.articlesRepository.findFavoritedArticleIds(
      articleIds,
      currentUserId,
    );

    for (const row of favoritedRows) {
      const stats = favoriteStats.get(Number(row.articleId));

      if (stats) {
        stats.favorited = true;
      }
    }

    return favoriteStats;
  }

  private async getFollowingAuthorIds(
    authorIds: number[],
    currentUserId?: number,
  ): Promise<Set<number>> {
    if (!currentUserId || authorIds.length === 0) {
      return new Set<number>();
    }

    const followingRows = await this.articlesRepository.findFollowingAuthorIds(
      authorIds,
      currentUserId,
    );

    return new Set(followingRows.map((row) => Number(row.authorId)));
  }
}
