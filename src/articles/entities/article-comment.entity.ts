import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { ArticleEntity } from './article.entity';

@Entity('article_comments')
export class ArticleCommentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  body!: string;

  @ManyToOne(() => ArticleEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article!: ArticleEntity;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
