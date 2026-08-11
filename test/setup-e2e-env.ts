process.env.NODE_ENV = 'test';
process.env.DB_DATABASE =
  process.env.DB_DATABASE_TEST ??
  process.env.TEST_DB_DATABASE ??
  'realworld_test';
process.env.JWT_SECRET ??= 'e2e-test-secret';
process.env.JWT_EXPIRES_IN ??= '1h';
