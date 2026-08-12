import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { ProfileResponse } from './interfaces/profile-response.interface';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponse> {
    const profileUser = await this.findProfileUser(username);
    const following = currentUserId
      ? await this.isFollowing(currentUserId, profileUser.id)
      : false;

    return this.buildProfileResponse(profileUser, following);
  }

  async followUser(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponse> {
    const currentUser = await this.findAuthenticatedUser(currentUserId);
    const profileUser = await this.findProfileUser(username);

    if (currentUser.id === profileUser.id) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['cannot follow yourself'],
        },
      });
    }

    const existingFollow = await this.isFollowing(
      currentUser.id,
      profileUser.id,
    );

    if (!existingFollow) {
      await this.usersRepository
        .createQueryBuilder()
        .relation(UserEntity, 'following')
        .of(currentUser.id)
        .add(profileUser.id);
    }

    return this.buildProfileResponse(profileUser, true);
  }

  async unfollowUser(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponse> {
    const currentUser = await this.findAuthenticatedUser(currentUserId);
    const profileUser = await this.findProfileUser(username);

    if (currentUser.id === profileUser.id) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['cannot unfollow yourself'],
        },
      });
    }

    await this.usersRepository
      .createQueryBuilder()
      .relation(UserEntity, 'following')
      .of(currentUser.id)
      .remove(profileUser.id);

    return this.buildProfileResponse(profileUser, false);
  }

  private async findAuthenticatedUser(userId: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  private async findProfileUser(username: string): Promise<UserEntity> {
    const profileUser = await this.usersRepository.findOne({
      where: { username },
    });

    if (!profileUser) {
      throw new NotFoundException('Profile not found');
    }

    return profileUser;
  }

  private async isFollowing(
    followerId: number,
    followingId: number,
  ): Promise<boolean> {
    if (followerId === followingId) {
      return false;
    }

    const follow = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.following', 'following', 'following.id = :followingId', {
        followingId,
      })
      .where('user.id = :followerId', { followerId })
      .getOne();

    return Boolean(follow);
  }

  private buildProfileResponse(
    user: UserEntity,
    following: boolean,
  ): ProfileResponse {
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following,
      },
    };
  }
}
