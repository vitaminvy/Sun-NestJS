import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { LoginUserRequestDto } from './dto/login-user.dto';
import { RegisterUserRequestDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserRequestDto })
  @ApiCreatedResponse({ type: UserResponseDto })
  register(@Body() body: RegisterUserRequestDto): Promise<UserResponseDto> {
    return this.usersService.register(body.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginUserRequestDto })
  @ApiOkResponse({ type: UserResponseDto })
  login(@Body() body: LoginUserRequestDto): Promise<UserResponseDto> {
    return this.usersService.login(body.user);
  }
}
