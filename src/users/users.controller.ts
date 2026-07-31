import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { LoginUserRequestDto } from './dto/login-user.dto';
import { RegisterUserRequestDto } from './dto/register-user.dto';
import { UserResponse } from './interfaces/user-response.interface';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  register(@Body() body: RegisterUserRequestDto): Promise<UserResponse> {
    return this.usersService.register(body.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginUserRequestDto): Promise<UserResponse> {
    return this.usersService.login(body.user);
  }
}
