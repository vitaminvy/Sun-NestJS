import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { RedisService } from '../redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,

    private readonly redisService: RedisService,

    private readonly i18nService: I18nService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
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

  async login(loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    const email = loginUserDto.email.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.INVALID_EMAIL_OR_PASSWORD',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.INVALID_EMAIL_OR_PASSWORD',
      );
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(
    userId: number,
    token: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18nService.t('translation.AUTH.ERRORS.UNAUTHORIZED'),
      );
    }

    return this.buildUserResponse(user, token);
  }

  async logout(token: string): Promise<{ message: string }> {
    const client = this.redisService.getClient();

    await client.set(token, 'blacklisted', 'EX', 3600);

    return {
      message: this.i18nService.t('translation.USERS.MESSAGES.LOGOUT_SUCCESS'),
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
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.EMAIL_TAKEN',
      );
    }

    const existingUsername = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.USERNAME_TAKEN',
      );
    }
  }

  private createBodyErrorException(
    translationKey: string,
  ): UnprocessableEntityException {
    return new UnprocessableEntityException({
      errors: {
        body: [this.i18nService.t(translationKey)],
      },
    });
  }

  private buildUserResponse(user: UserEntity, token?: string): UserResponseDto {
    const userToken =
      token ??
      this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });

    return new UserResponseDto(user, userToken);
  }
}
