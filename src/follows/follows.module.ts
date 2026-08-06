import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { createJwtModuleOptions } from '../auth/jwt-module-options.factory';
import { RedisModule } from '../redis/redis.module';
import { UserEntity } from '../users/entities/user.entity';
import { FollowsDataAccess } from './follows-data-access';
import { FollowsService } from './follows.service';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createJwtModuleOptions,
    }),
    RedisModule,
  ],
  controllers: [ProfilesController],
  providers: [
    FollowsDataAccess,
    FollowsService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [FollowsService],
})
export class FollowsModule {}
