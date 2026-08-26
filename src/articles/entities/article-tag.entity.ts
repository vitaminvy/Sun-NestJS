import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ArticleEntity } from './article.entity';

@Entity('tags')
export class ArticleTagEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 255 })
  name!: string;

  @ManyToMany(() => ArticleEntity, (article) => article.tags)
  articles!: ArticleEntity[];
}
