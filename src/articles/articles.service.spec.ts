import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { UserEntity } from '../users/entities/user.entity';
import { ArticlesRepository } from './articles.repository';
import { ArticlesService } from './articles.service';
import { ArticleCommentEntity } from './entities/article-comment.entity';
import { ArticleEntity } from './entities/article.entity';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repository: Record<string, jest.Mock>;

  const date = new Date('2026-08-06T00:00:00.000Z');

  const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    password: 'hashed-password',
    bio: null,
    image: null,
    following: [],
    followers: [],
    createdAt: date,
    updatedAt: date,
    ...overrides,
  });

  const buildArticle = (
    overrides: Partial<ArticleEntity> = {},
  ): ArticleEntity => ({
    id: 10,
    slug: 'how-to-train-your-dragon',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'You have to believe',
    author: buildUser({ id: 2, username: 'author' }),
    tags: [],
    favoritedBy: [],
    createdAt: date,
    updatedAt: date,
    ...overrides,
  });

  const buildComment = (
    overrides: Partial<ArticleCommentEntity> = {},
  ): ArticleCommentEntity => ({
    id: 100,
    body: 'Great article!',
    article: buildArticle(),
    author: buildUser(),
    createdAt: date,
    updatedAt: date,
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      createComment: jest.fn(),
      findArticleBySlug: jest.fn(),
      findCommentByIdAndArticleId: jest.fn(),
      findCommentsByArticleId: jest.fn(),
      findFollowingAuthorIds: jest.fn().mockResolvedValue([]),
      findUserById: jest.fn(),
      removeComment: jest.fn(),
      saveComment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: ArticlesRepository,
          useValue: repository,
        },
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => key,
          },
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('adds a comment to an article', async () => {
    const article = buildArticle();
    const author = buildUser({ id: 1, username: 'commenter' });
    const unsavedComment = buildComment({
      id: 0,
      article,
      author,
      body: 'Great article!',
    });
    const savedComment = buildComment({
      id: 5,
      article,
      author,
      body: 'Great article!',
    });

    repository.findArticleBySlug.mockResolvedValue(article);
    repository.findUserById.mockResolvedValue(author);
    repository.createComment.mockReturnValue(unsavedComment);
    repository.saveComment.mockResolvedValue(savedComment);

    const response = await service.addComment(article.slug, author.id, {
      body: '  Great article!  ',
    });

    expect(repository.createComment).toHaveBeenCalledWith({
      body: 'Great article!',
      article,
      author,
    });
    expect(repository.saveComment).toHaveBeenCalledWith(unsavedComment);
    expect(response.comment).toMatchObject({
      id: savedComment.id,
      body: savedComment.body,
      author: {
        username: author.username,
        following: false,
      },
    });
  });

  it('gets comments from an article with following state', async () => {
    const article = buildArticle();
    const commentAuthor = buildUser({ id: 7, username: 'bob' });
    const comment = buildComment({
      id: 15,
      article,
      author: commentAuthor,
    });

    repository.findArticleBySlug.mockResolvedValue(article);
    repository.findCommentsByArticleId.mockResolvedValue([comment]);
    repository.findFollowingAuthorIds.mockResolvedValue([
      { authorId: commentAuthor.id },
    ]);

    const response = await service.getComments(article.slug, 1);

    expect(repository.findCommentsByArticleId).toHaveBeenCalledWith(article.id);
    expect(repository.findFollowingAuthorIds).toHaveBeenCalledWith(
      [commentAuthor.id],
      1,
    );
    expect(response.comments).toHaveLength(1);
    expect(response.comments[0]).toMatchObject({
      id: comment.id,
      body: comment.body,
      author: {
        username: commentAuthor.username,
        following: true,
      },
    });
  });

  it('deletes a comment owned by the current user', async () => {
    const currentUser = buildUser({ id: 1 });
    const article = buildArticle();
    const comment = buildComment({
      id: 21,
      article,
      author: currentUser,
    });

    repository.findUserById.mockResolvedValue(currentUser);
    repository.findArticleBySlug.mockResolvedValue(article);
    repository.findCommentByIdAndArticleId.mockResolvedValue(comment);

    await service.deleteComment(
      article.slug,
      String(comment.id),
      currentUser.id,
    );

    expect(repository.findCommentByIdAndArticleId).toHaveBeenCalledWith(
      comment.id,
      article.id,
    );
    expect(repository.removeComment).toHaveBeenCalledWith(comment);
  });

  it('rejects an invalid comment id', async () => {
    await expect(
      service.deleteComment('how-to-train-your-dragon', 'not-a-number', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findUserById).not.toHaveBeenCalled();
    expect(repository.findArticleBySlug).not.toHaveBeenCalled();
    expect(repository.findCommentByIdAndArticleId).not.toHaveBeenCalled();
    expect(repository.removeComment).not.toHaveBeenCalled();
  });

  it('blocks deleting another user comment', async () => {
    const currentUser = buildUser({ id: 1 });
    const article = buildArticle();
    const comment = buildComment({
      id: 21,
      article,
      author: buildUser({ id: 2, username: 'bob' }),
    });

    repository.findUserById.mockResolvedValue(currentUser);
    repository.findArticleBySlug.mockResolvedValue(article);
    repository.findCommentByIdAndArticleId.mockResolvedValue(comment);

    await expect(
      service.deleteComment(article.slug, String(comment.id), currentUser.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.removeComment).not.toHaveBeenCalled();
  });
});
