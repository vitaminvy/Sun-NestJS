import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LoginUserRequestDto } from './dto/login-user.dto';
import { RegisterUserRequestDto } from './dto/register-user.dto';
import { UserResponse } from './interfaces/user-response.interface';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserRequestDto })
  register(@Body() body: RegisterUserRequestDto): Promise<UserResponse> {
    return this.usersService.register(body.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginUserRequestDto })
  login(@Body() body: LoginUserRequestDto): Promise<UserResponse> {
    return this.usersService.login(body.user);
  }
}
