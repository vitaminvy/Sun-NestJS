import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FollowsService } from './follows.service';
import { ProfileResponse } from './interfaces/profile-response.interface';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly followsService: FollowsService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get profile by username' })
  getProfile(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ProfileResponse> {
    return this.followsService.getProfile(username, request.user?.sub);
  }

  @Post(':username/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow user' })
  followUser(
    @Param('username') username: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ProfileResponse> {
    return this.followsService.followUser(currentUser.sub, username);
  }

  @Delete(':username/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow user' })
  unfollowUser(
    @Param('username') username: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ProfileResponse> {
    return this.followsService.unfollowUser(currentUser.sub, username);
  }
}
