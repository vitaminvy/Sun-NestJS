import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type ms from 'ms';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedisModule } from '../redis/redis.module';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET')?.trim();

        if (!secret) {
          throw new Error('JWT_SECRET must be set');
        }

        const expiresIn = configService.get<ms.StringValue>(
          'JWT_EXPIRES_IN',
          '1d',
        );

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    RedisModule,
  ],
  controllers: [UsersController, UserController],
  providers: [UsersService, JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
