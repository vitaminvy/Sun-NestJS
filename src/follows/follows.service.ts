import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  FollowsDataAccess,
  type FollowUserRecord,
} from './follows-data-access';
import { ProfileResponse } from './interfaces/profile-response.interface';

interface FollowStore {
  addFollowing(followerId: number, followingId: number): Promise<void>;
  findUserById(userId: number): Promise<FollowUserRecord | null>;
  findUserByUsername(username: string): Promise<FollowUserRecord | null>;
  hasFollowing(followerId: number, followingId: number): Promise<boolean>;
  removeFollowing(followerId: number, followingId: number): Promise<void>;
}

@Injectable()
export class FollowsService {
  constructor(
    @Inject(FollowsDataAccess)
    private readonly followsRepository: FollowStore,
  ) {}

  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponse> {
    const profileUser = await this.loadProfileUser(username);
    const following = currentUserId
      ? await this.checkFollowing(currentUserId, profileUser.id)
      : false;

    return this.buildProfileResponse(profileUser, following);
  }

  async followUser(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponse> {
    const currentUser = await this.loadAuthenticatedUser(currentUserId);
    const profileUser = await this.loadProfileUser(username);

    if (currentUser.id === profileUser.id) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['cannot follow yourself'],
        },
      });
    }

    const existingFollow = await this.checkFollowing(
      currentUser.id,
      profileUser.id,
    );

    if (!existingFollow) {
      await this.followsRepository.addFollowing(currentUser.id, profileUser.id);
    }

    return this.buildProfileResponse(profileUser, true);
  }

  async unfollowUser(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponse> {
    const currentUser = await this.loadAuthenticatedUser(currentUserId);
    const profileUser = await this.loadProfileUser(username);

    if (currentUser.id === profileUser.id) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['cannot unfollow yourself'],
        },
      });
    }

    await this.followsRepository.removeFollowing(
      currentUser.id,
      profileUser.id,
    );

    return this.buildProfileResponse(profileUser, false);
  }

  private async loadAuthenticatedUser(
    userId: number,
  ): Promise<FollowUserRecord> {
    const user = await this.followsRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  private async loadProfileUser(username: string): Promise<FollowUserRecord> {
    const profileUser =
      await this.followsRepository.findUserByUsername(username);

    if (!profileUser) {
      throw new NotFoundException('Profile not found');
    }

    return profileUser;
  }

  private async checkFollowing(
    followerId: number,
    followingId: number,
  ): Promise<boolean> {
    if (followerId === followingId) {
      return false;
    }

    return this.followsRepository.hasFollowing(followerId, followingId);
  }

  private buildProfileResponse(
    user: FollowUserRecord,
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
