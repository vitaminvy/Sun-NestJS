import { ApiProperty } from '@nestjs/swagger';

import { ArticleEntity } from '../entities/article.entity';

export class ArticleAuthorDto {
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @ApiProperty({ example: 'I work at Sun Asterisk.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  image!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;

  constructor(article: ArticleEntity, following: boolean) {
    this.username = article.author.username;
    this.bio = article.author.bio;
    this.image = article.author.image;
    this.following = following;
  }
}

export class ArticleResponseDataDto {
  @ApiProperty({ example: 'how-to-train-your-dragon' })
  slug!: string;

  @ApiProperty({ example: 'How to train your dragon' })
  title!: string;

  @ApiProperty({ example: 'Ever wonder how?' })
  description!: string;

  @ApiProperty({ example: 'You have to believe' })
  body!: string;

  @ApiProperty({ example: ['dragons', 'training'], type: [String] })
  tagList!: string[];

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ example: false })
  favorited!: boolean;

  @ApiProperty({ example: 0 })
  favoritesCount!: number;

  @ApiProperty({ type: ArticleAuthorDto })
  author!: ArticleAuthorDto;

  constructor(
    article: ArticleEntity,
    favorited: boolean,
    favoritesCount: number,
    following: boolean,
  ) {
    this.slug = article.slug;
    this.title = article.title;
    this.description = article.description;
    this.body = article.body;
    this.tagList = article.tags?.map((tag) => tag.name) ?? [];
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
    this.favorited = favorited;
    this.favoritesCount = favoritesCount;
    this.author = new ArticleAuthorDto(article, following);
  }
}

export class ArticleResponseDto {
  @ApiProperty({ type: ArticleResponseDataDto })
  article!: ArticleResponseDataDto;

  constructor(
    article: ArticleEntity,
    favorited: boolean,
    favoritesCount: number,
    following: boolean,
  ) {
    this.article = new ArticleResponseDataDto(
      article,
      favorited,
      favoritesCount,
      following,
    );
  }
}

export class ArticlesResponseDto {
  @ApiProperty({ type: [ArticleResponseDataDto] })
  articles!: ArticleResponseDataDto[];

  @ApiProperty({ example: 1 })
  articlesCount!: number;

  constructor(articles: ArticleResponseDataDto[], articlesCount: number) {
    this.articles = articles;
    this.articlesCount = articlesCount;
  }
}
