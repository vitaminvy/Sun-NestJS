import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { ArticleCommentEntity } from './entities/article-comment.entity';
import { ArticleTagEntity } from './entities/article-tag.entity';
import { ArticleEntity } from './entities/article.entity';

interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  slug: string;
  author: UserEntity;
  tags: ArticleTagEntity[];
}

interface CreateCommentData {
  body: string;
  article: ArticleEntity;
  author: UserEntity;
}

export interface ArticleFavoriteCountRow {
  articleId: number | string;
  favoritesCount: number | string;
}

export interface ArticleIdRow {
  articleId: number | string;
}

export interface AuthorIdRow {
  authorId: number | string;
}

type ArticleQueryBuilder = SelectQueryBuilder<ArticleEntity>;

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articlesRepository: Repository<ArticleEntity>,

    @InjectRepository(ArticleTagEntity)
    private readonly articleTagsRepository: Repository<ArticleTagEntity>,

    @InjectRepository(ArticleCommentEntity)
    private readonly articleCommentsRepository: Repository<ArticleCommentEntity>,

    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  createArticle(articleData: CreateArticleData): ArticleEntity {
    return this.articlesRepository.create(articleData);
  }

  saveArticle(article: ArticleEntity): Promise<ArticleEntity> {
    return this.articlesRepository.save(article);
  }

  async removeArticle(article: ArticleEntity): Promise<void> {
    await this.articlesRepository.remove(article);
  }

  createComment(commentData: CreateCommentData): ArticleCommentEntity {
    return this.articleCommentsRepository.create(commentData);
  }

  saveComment(comment: ArticleCommentEntity): Promise<ArticleCommentEntity> {
    return this.articleCommentsRepository.save(comment);
  }

  async removeComment(comment: ArticleCommentEntity): Promise<void> {
    await this.articleCommentsRepository.remove(comment);
  }

  findUserById(userId: number): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }

  findArticleBySlug(slug: string): Promise<ArticleEntity | null> {
    return this.articlesRepository.findOne({
      where: { slug },
      relations: {
        author: true,
        tags: true,
      },
    });
  }

  findCommentsByArticleId(articleId: number): Promise<ArticleCommentEntity[]> {
    return this.articleCommentsRepository.find({
      where: {
        article: { id: articleId },
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  findCommentByIdAndArticleId(
    commentId: number,
    articleId: number,
  ): Promise<ArticleCommentEntity | null> {
    return this.articleCommentsRepository.findOne({
      where: {
        id: commentId,
        article: { id: articleId },
      },
      relations: {
        author: true,
        article: true,
      },
    });
  }

  findArticles(
    query: ListArticlesQueryDto,
    limit: number,
    offset: number,
  ): Promise<[ArticleEntity[], number]> {
    const queryBuilder = this.articlesRepository
      .createQueryBuilder('article')
      .innerJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip(offset)
      .take(limit);

    this.withTagFilter(queryBuilder, query.tag);
    this.withAuthorFilter(queryBuilder, query.author);
    this.withFavoritedFilter(queryBuilder, query.favorited);

    return queryBuilder.getManyAndCount();
  }

  findFeedArticles(
    currentUserId: number,
    limit: number,
    offset: number,
  ): Promise<[ArticleEntity[], number]> {
    return this.articlesRepository
      .createQueryBuilder('article')
      .innerJoinAndSelect('article.author', 'author')
      .innerJoin(
        'author.followers',
        'follower',
        'follower.id = :currentUserId',
        {
          currentUserId,
        },
      )
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  findTagByName(tagName: string): Promise<ArticleTagEntity | null> {
    return this.articleTagsRepository.findOne({
      where: { name: tagName },
    });
  }

  createTag(tagName: string): ArticleTagEntity {
    return this.articleTagsRepository.create({ name: tagName });
  }

  saveTag(tag: ArticleTagEntity): Promise<ArticleTagEntity> {
    return this.articleTagsRepository.save(tag);
  }

  async slugExists(slug: string, articleIdToIgnore?: number): Promise<boolean> {
    const queryBuilder = this.articlesRepository
      .createQueryBuilder('article')
      .where('article.slug = :slug', { slug });

    if (articleIdToIgnore) {
      queryBuilder.andWhere('article.id != :articleIdToIgnore', {
        articleIdToIgnore,
      });
    }

    return (await queryBuilder.getCount()) > 0;
  }

  async isArticleFavoritedByUser(
    articleId: number,
    userId: number,
  ): Promise<boolean> {
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .innerJoin('article.favoritedBy', 'favorite', 'favorite.id = :userId', {
        userId,
      })
      .where('article.id = :articleId', { articleId })
      .getOne();

    return Boolean(article);
  }

  async addFavorite(articleId: number, userId: number): Promise<void> {
    await this.articlesRepository
      .createQueryBuilder()
      .relation(ArticleEntity, 'favoritedBy')
      .of(articleId)
      .add(userId);
  }

  async removeFavorite(articleId: number, userId: number): Promise<void> {
    await this.articlesRepository
      .createQueryBuilder()
      .relation(ArticleEntity, 'favoritedBy')
      .of(articleId)
      .remove(userId);
  }

  findFavoriteCounts(articleIds: number[]): Promise<ArticleFavoriteCountRow[]> {
    return this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.favoritedBy', 'favorite')
      .select('article.id', 'articleId')
      .addSelect('COUNT(favorite.id)', 'favoritesCount')
      .where('article.id IN (:...articleIds)', { articleIds })
      .groupBy('article.id')
      .getRawMany<ArticleFavoriteCountRow>();
  }

  findFavoritedArticleIds(
    articleIds: number[],
    currentUserId: number,
  ): Promise<ArticleIdRow[]> {
    return this.articlesRepository
      .createQueryBuilder('article')
      .innerJoin(
        'article.favoritedBy',
        'favorite',
        'favorite.id = :currentUserId',
        {
          currentUserId,
        },
      )
      .select('article.id', 'articleId')
      .where('article.id IN (:...articleIds)', { articleIds })
      .getRawMany<ArticleIdRow>();
  }

  findFollowingAuthorIds(
    authorIds: number[],
    currentUserId: number,
  ): Promise<AuthorIdRow[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.following', 'following')
      .select('following.id', 'authorId')
      .where('user.id = :currentUserId', { currentUserId })
      .andWhere('following.id IN (:...authorIds)', { authorIds })
      .getRawMany<AuthorIdRow>();
  }

  private withTagFilter(queryBuilder: ArticleQueryBuilder, tag?: string): void {
    if (!tag) {
      return;
    }

    queryBuilder.innerJoin(
      'article.tags',
      'filterTag',
      'filterTag.name = :tag',
      {
        tag: tag.trim(),
      },
    );
  }

  private withAuthorFilter(
    queryBuilder: ArticleQueryBuilder,
    author?: string,
  ): void {
    if (!author) {
      return;
    }

    queryBuilder.andWhere('author.username = :author', {
      author: author.trim(),
    });
  }

  private withFavoritedFilter(
    queryBuilder: ArticleQueryBuilder,
    favorited?: string,
  ): void {
    if (!favorited) {
      return;
    }

    queryBuilder.innerJoin(
      'article.favoritedBy',
      'favoritedUser',
      'favoritedUser.username = :favorited',
      {
        favorited: favorited.trim(),
      },
    );
  }
}
