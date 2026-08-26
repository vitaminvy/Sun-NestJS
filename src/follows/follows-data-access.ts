import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';

export interface FollowUserRecord {
  id: number;
  username: string;
  bio: string | null;
  image: string | null;
}

@Injectable()
export class FollowsDataAccess {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findUserById(userId: number): Promise<FollowUserRecord | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }

  findUserByUsername(username: string): Promise<FollowUserRecord | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async hasFollowing(
    followerId: number,
    followingId: number,
  ): Promise<boolean> {
    const follow = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.following', 'following', 'following.id = :followingId', {
        followingId,
      })
      .where('user.id = :followerId', { followerId })
      .getOne();

    return Boolean(follow);
  }

  async addFollowing(followerId: number, followingId: number): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .relation(UserEntity, 'following')
      .of(followerId)
      .add(followingId);
  }

  async removeFollowing(
    followerId: number,
    followingId: number,
  ): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .relation(UserEntity, 'following')
      .of(followerId)
      .remove(followingId);
  }
}
