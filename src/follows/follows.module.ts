import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type ms from 'ms';

import { AttachmentEntity } from '../attachments/entities/attachment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RedisModule } from '../redis/redis.module';
import { UserEntity } from '../users/entities/user.entity';
import { FollowsService } from './follows.service';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentEntity, UserEntity]),
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
  controllers: [ProfilesController],
  providers: [FollowsService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [FollowsService],
})
export class FollowsModule {}
