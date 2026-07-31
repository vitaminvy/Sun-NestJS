import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { RedisService } from '../redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserResponse } from './interfaces/user-response.interface';

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,

    private readonly redisService: RedisService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<UserResponse> {
    const email = registerUserDto.email.trim().toLowerCase();
    const username = registerUserDto.username.trim();

    await this.validateUniqueUser(email, username);

    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      this.passwordSaltRounds,
    );

    const user = this.usersRepository.create({
      email,
      username,
      password: hashedPassword,
      bio: null,
      image: null,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.buildUserResponse(savedUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponse> {
    const email = loginUserDto.email.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email or password is invalid'],
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email or password is invalid'],
        },
      });
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(userId: number, token: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.buildUserResponse(user, token);
  }

  async logout(token: string): Promise<{ message: string }> {
    const client = this.redisService.getClient();

    await client.set(token, 'blacklisted', 'EX', 3600);

    return {
      message: 'Logout successfully',
    };
  }

  private async validateUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    const existingEmail = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email has already been taken'],
        },
      });
    }

    const existingUsername = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['username has already been taken'],
        },
      });
    }
  }

  private buildUserResponse(user: UserEntity, token?: string): UserResponse {
    const userToken =
      token ??
      this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });

    return {
      user: {
        email: user.email,
        token: userToken,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }
}
