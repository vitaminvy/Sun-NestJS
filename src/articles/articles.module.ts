import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { createJwtModuleOptions } from '../auth/jwt-module-options.factory';
import { RedisModule } from '../redis/redis.module';
import { UserEntity } from '../users/entities/user.entity';
import { ArticlesRepository } from './articles.repository';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticleCommentEntity } from './entities/article-comment.entity';
import { ArticleTagEntity } from './entities/article-tag.entity';
import { ArticleEntity } from './entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      ArticleTagEntity,
      ArticleCommentEntity,
      UserEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createJwtModuleOptions,
    }),
    RedisModule,
  ],
  controllers: [ArticlesController],
  providers: [
    ArticlesRepository,
    ArticlesService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [ArticlesService],
})
export class ArticlesModule {}
