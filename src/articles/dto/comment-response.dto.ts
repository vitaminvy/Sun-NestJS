import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '../../users/entities/user.entity';
import { ArticleCommentEntity } from '../entities/article-comment.entity';

export class CommentAuthorDto {
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @ApiProperty({ example: 'I work at Sun Asterisk.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  image!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;

  constructor(author: UserEntity, following: boolean) {
    this.username = author.username;
    this.bio = author.bio;
    this.image = author.image;
    this.following = following;
  }
}

export class CommentResponseDataDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Great article!' })
  body!: string;

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: CommentAuthorDto })
  author!: CommentAuthorDto;

  constructor(comment: ArticleCommentEntity, following: boolean) {
    this.id = comment.id;
    this.body = comment.body;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.author = new CommentAuthorDto(comment.author, following);
  }
}

export class CommentResponseDto {
  @ApiProperty({ type: CommentResponseDataDto })
  comment!: CommentResponseDataDto;

  constructor(comment: ArticleCommentEntity, following: boolean) {
    this.comment = new CommentResponseDataDto(comment, following);
  }
}

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentResponseDataDto] })
  comments!: CommentResponseDataDto[];

  constructor(comments: CommentResponseDataDto[]) {
    this.comments = comments;
  }
}
