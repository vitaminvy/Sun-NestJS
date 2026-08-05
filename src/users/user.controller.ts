import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { CurrentToken } from '../auth/decorators/current-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: UserResponseDto })
  getCurrentUser(
    @CurrentUser() currentUser: JwtPayload,
    @CurrentToken() token: string,
  ): Promise<UserResponseDto> {
    return this.usersService.getCurrentUser(currentUser.sub, token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentToken() token: string): Promise<{ message: string }> {
    return this.usersService.logout(token);
  }
}
