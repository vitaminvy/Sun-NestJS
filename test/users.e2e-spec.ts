import * as bcrypt from 'bcrypt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { RedisService } from '../src/redis/redis.service';
import { UserEntity } from '../src/users/entities/user.entity';
import { configureE2eApp } from './helpers/e2e-app';
import {
  ensureE2eDatabaseExists,
  rebuildE2eSchema,
  seedUser,
  truncateE2eDatabase,
} from './helpers/e2e-database';
import type { SeededUser } from './helpers/e2e-database';
import { createFakeRedisService } from './helpers/fake-redis.service';

interface UserResponseBody {
  user: {
    bio: string | null;
    email: string;
    image: string | null;
    token: string;
    username: string;
  };
}

describe('UsersController (e2e C2)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let seededUser: SeededUser;

  const redisService = createFakeRedisService();

  beforeAll(async () => {
    await ensureE2eDatabaseExists();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureE2eApp(app);

    await app.init();

    dataSource = moduleFixture.get(DataSource);
    await rebuildE2eSchema(dataSource);
  });

  beforeEach(async () => {
    redisService.clear();
    await truncateE2eDatabase(dataSource);

    seededUser = await seedUser(dataSource, {
      email: 'seed@example.com',
      username: 'seed-user',
    });
  });

  afterEach(async () => {
    redisService.clear();

    if (dataSource?.isInitialized) {
      await truncateE2eDatabase(dataSource);
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /api/users registers a user through the full HTTP-to-database flow', async () => {
    const requestBody = {
      user: {
        email: 'new-user@example.com',
        password: 'Register123!',
        username: 'new-user',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(requestBody)
      .expect(201);
    const body = response.body as UserResponseBody;

    expect(response.headers['cache-control']).toBe(
      'no-store, no-cache, must-revalidate',
    );
    expect(body.user.token).toEqual(expect.any(String));
    expect(body.user.token.length).toBeGreaterThan(20);
    expect(body).toMatchObject({
      user: {
        bio: null,
        email: requestBody.user.email,
        image: null,
        username: requestBody.user.username,
      },
    });

    const usersRepository = dataSource.getRepository(UserEntity);
    const createdUser = await usersRepository.findOne({
      where: { email: requestBody.user.email },
    });
    const allUsers = await usersRepository.find();

    expect(allUsers).toHaveLength(2);
    expect(createdUser).toEqual(
      expect.objectContaining({
        bio: null,
        email: requestBody.user.email,
        image: null,
        username: requestBody.user.username,
      }),
    );
    expect(createdUser?.password).not.toBe(requestBody.user.password);
    await expect(
      bcrypt.compare(requestBody.user.password, createdUser?.password ?? ''),
    ).resolves.toBe(true);
  });

  it('POST /api/users/login authenticates the fake user seeded before the test', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'SEED@example.com',
          password: seededUser.password,
        },
      })
      .expect(200);
    const body = response.body as UserResponseBody;

    expect(body.user.token).toEqual(expect.any(String));
    expect(body.user.token.length).toBeGreaterThan(20);
    expect(body).toMatchObject({
      user: {
        bio: seededUser.user.bio,
        email: seededUser.user.email,
        image: seededUser.user.image,
        username: seededUser.user.username,
      },
    });
  });

  it('POST /api/users returns a business error when the seeded email already exists', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: seededUser.user.email,
          password: 'Register123!',
          username: 'another-user',
        },
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['email has already been taken'],
      },
    });
  });
});
