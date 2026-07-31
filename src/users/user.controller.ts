import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentToken } from '../auth/decorators/current-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserResponse } from './interfaces/user-response.interface';
import { UsersService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser() currentUser: JwtPayload,
    @CurrentToken() token: string,
  ): Promise<UserResponse> {
    return this.usersService.getCurrentUser(currentUser.sub, token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentToken() token: string): Promise<{ message: string }> {
    return this.usersService.logout(token);
  }
}
