import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 255 })
  username!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  image!: string | null;

  @ManyToMany(() => UserEntity, (user) => user.followers)
  @JoinTable({
    name: 'user_follows',
    joinColumn: {
      name: 'follower_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'following_id',
      referencedColumnName: 'id',
    },
  })
  following!: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.following)
  followers!: UserEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
