interface StoredRedisValue {
  expiresAt?: number;
  value: string;
}

interface FakeRedisClient {
  exists(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  set(
    key: string,
    value: string,
    expirationMode?: string,
    ttlSeconds?: number,
  ): Promise<'OK'>;
}

export interface FakeRedisService {
  clear(): void;
  getClient(): FakeRedisClient;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

export const createFakeRedisService = (): FakeRedisService => {
  const store = new Map<string, StoredRedisValue>();

  const getStoredValue = (key: string): StoredRedisValue | undefined => {
    const storedValue = store.get(key);

    if (!storedValue) {
      return undefined;
    }

    if (storedValue.expiresAt && storedValue.expiresAt <= Date.now()) {
      store.delete(key);

      return undefined;
    }

    return storedValue;
  };

  const client: FakeRedisClient = {
    exists(key: string): Promise<number> {
      return Promise.resolve(getStoredValue(key) ? 1 : 0);
    },

    expire(key: string, ttlSeconds: number): Promise<number> {
      const storedValue = getStoredValue(key);

      if (!storedValue) {
        return Promise.resolve(0);
      }

      storedValue.expiresAt = Date.now() + ttlSeconds * 1000;

      return Promise.resolve(1);
    },

    get(key: string): Promise<string | null> {
      return Promise.resolve(getStoredValue(key)?.value ?? null);
    },

    incr(key: string): Promise<number> {
      const nextValue = Number(getStoredValue(key)?.value ?? 0) + 1;

      store.set(key, { value: String(nextValue) });

      return Promise.resolve(nextValue);
    },

    set(
      key: string,
      value: string,
      expirationMode?: string,
      ttlSeconds?: number,
    ): Promise<'OK'> {
      store.set(key, {
        value,
        expiresAt:
          expirationMode?.toUpperCase() === 'EX' && ttlSeconds
            ? Date.now() + ttlSeconds * 1000
            : undefined,
      });

      return Promise.resolve('OK');
    },
  };

  return {
    clear: () => store.clear(),
    getClient: () => client,
    isTokenBlacklisted: (token: string) =>
      client.exists(token).then((exists) => exists === 1),
  };
};
