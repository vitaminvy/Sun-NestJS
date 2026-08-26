import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentEntity } from '../attachments/entities/attachment.entity';
import { AccessCredentialRepository } from '../auth/access-credential.repository';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoginRateLimitGuard } from '../auth/guards/login-rate-limit.guard';
import { createJwtModuleOptions } from '../auth/jwt-module-options.factory';
import { RedisModule } from '../redis/redis.module';
import { UserEntity } from './entities/user.entity';
import { AvatarFilePipe } from './pipes/avatar-file.pipe';
import { UserController } from './user.controller';
import { UsersDataAccess } from './users-data-access';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentEntity, UserEntity]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createJwtModuleOptions,
    }),
    RedisModule,
  ],
  controllers: [UsersController, UserController],
  providers: [
    AccessCredentialRepository,
    AvatarFilePipe,
    UsersDataAccess,
    UsersService,
    JwtAuthGuard,
    LoginRateLimitGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
