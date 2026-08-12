import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentToken } from '../auth/decorators/current-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { LocalUploadedFile } from '../uploads/interfaces/local-uploaded-file.interface';
import { avatarUploadOptions } from '../uploads/utils/avatar-upload-options.util';
import { UpdateUserRequestDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('User')
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

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  @ApiOperation({ summary: 'Update current user' })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                username: { type: 'string', example: 'johndoe' },
                email: { type: 'string', example: 'john@example.com' },
                password: { type: 'string', example: 'newpassword123' },
                bio: {
                  type: 'string',
                  nullable: true,
                  example: 'I love NestJS',
                },
              },
            },
          },
        },
        {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', example: 'newpassword123' },
            bio: { type: 'string', nullable: true, example: 'I love NestJS' },
            avatar: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      ],
    },
  })
  updateCurrentUser(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: UpdateUserRequestDto,
    @UploadedFile() avatar?: LocalUploadedFile,
  ): Promise<UserResponseDto> {
    return this.usersService.updateCurrentUser(currentUser.sub, body, avatar);
  }
}
