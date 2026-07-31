import { Module } from '@nestjs/common';
import { I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [new QueryResolver(['lang'])],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
