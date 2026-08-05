import {
  BadRequestException,
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
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentToken } from '../auth/decorators/current-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { LocalUploadedFile } from '../uploads/interfaces/local-uploaded-file.interface';
import {
  AVATAR_MIME_TYPE_EXTENSIONS,
  MAX_AVATAR_FILE_SIZE,
  USER_AVATAR_UPLOAD_DIR,
} from '../uploads/upload.constants';
import { UpdateUserRequestDto } from './dto/update-user.dto';
import { UserResponse } from './interfaces/user-response.interface';
import { UsersService } from './users.service';

@ApiTags('User')
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

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      dest: USER_AVATAR_UPLOAD_DIR,
      fileFilter: (_request, file: LocalUploadedFile, callback) => {
        if (!AVATAR_MIME_TYPE_EXTENSIONS[file.mimetype]) {
          callback(
            new BadRequestException('avatar must be a gif, jpeg, png or webp'),
            false,
          );

          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: MAX_AVATAR_FILE_SIZE,
      },
    }),
  )
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
  ): Promise<UserResponse> {
    return this.usersService.updateCurrentUser(currentUser.sub, body, avatar);
  }
}
