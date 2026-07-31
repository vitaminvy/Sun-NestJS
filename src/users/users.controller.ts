import { Body, Controller, Post } from '@nestjs/common';

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
}
