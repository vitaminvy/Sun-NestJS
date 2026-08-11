import * as bcrypt from 'bcrypt';
import { createConnection } from 'mysql2/promise';
import { DataSource } from 'typeorm';

import { UserEntity } from '../../src/users/entities/user.entity';

const DEFAULT_TEST_PASSWORD = 'Password123!';
const TRUNCATED_TABLES = [
  'article_comments',
  'article_favorites',
  'article_tags',
  'articles',
  'tags',
  'attachments',
  'user_follows',
  'users',
] as const;

interface SeedUserOptions {
  bio?: string | null;
  email?: string;
  image?: string | null;
  password?: string;
  username?: string;
}

export interface SeededUser {
  password: string;
  user: UserEntity;
}

let seedUserSequence = 0;

export const ensureE2eDatabaseExists = async (): Promise<void> => {
  const databaseName = getE2eDatabaseName();

  assertSafeE2eDatabaseName(databaseName);

  try {
    const connection = await createConnection({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeMysqlIdentifier(
        databaseName,
      )} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.end();
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Cannot prepare e2e database "${databaseName}". ` +
        `Create it manually or set DB_DATABASE_TEST/TEST_DB_DATABASE. Cause: ${cause}`,
    );
  }
};

export const rebuildE2eSchema = async (
  dataSource: DataSource,
): Promise<void> => {
  assertSafeE2eDatabaseName(getDataSourceDatabaseName(dataSource));

  await dataSource.synchronize(true);
};

export const truncateE2eDatabase = async (
  dataSource: DataSource,
): Promise<void> => {
  assertSafeE2eDatabaseName(getDataSourceDatabaseName(dataSource));

  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  try {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of TRUNCATED_TABLES) {
      await queryRunner.query(
        `TRUNCATE TABLE ${escapeMysqlIdentifier(tableName)}`,
      );
    }
  } finally {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    await queryRunner.release();
  }
};

export const seedUser = async (
  dataSource: DataSource,
  options: SeedUserOptions = {},
): Promise<SeededUser> => {
  seedUserSequence += 1;

  const password = options.password ?? DEFAULT_TEST_PASSWORD;
  const usersRepository = dataSource.getRepository(UserEntity);
  const user = usersRepository.create({
    bio: options.bio ?? null,
    email: options.email ?? `seed-${seedUserSequence}@example.com`,
    image: options.image ?? null,
    password: await bcrypt.hash(password, 4),
    username: options.username ?? `seed-user-${seedUserSequence}`,
  });
  const savedUser = await usersRepository.save(user);

  return {
    password,
    user: savedUser,
  };
};

const getE2eDatabaseName = (): string =>
  process.env.DB_DATABASE_TEST ??
  process.env.TEST_DB_DATABASE ??
  process.env.DB_DATABASE ??
  'realworld_test';

const getDataSourceDatabaseName = (dataSource: DataSource): string =>
  String(dataSource.options.database ?? '');

const assertSafeE2eDatabaseName = (databaseName: string): void => {
  if (!databaseName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to rebuild/truncate non-test database "${databaseName}". ` +
        'Use DB_DATABASE_TEST or TEST_DB_DATABASE with a database name that includes "test".',
    );
  }
};

const escapeMysqlIdentifier = (identifier: string): string =>
  `\`${identifier.replace(/`/g, '``')}\``;
