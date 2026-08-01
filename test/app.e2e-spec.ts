import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: 'en',
          loaderOptions: {
            path: join(process.cwd(), 'src/i18n/'),
            watch: false,
          },
          resolvers: [new QueryResolver(['lang'])],
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('should return Vietnamese from lang query param', () => {
    return request(app.getHttpServer())
      .get('/?lang=vi')
      .expect(200)
      .expect('Xin chào thế giới!');
  });

  afterAll(async () => {
    await app.close();
  });
});
