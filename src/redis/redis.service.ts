import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      lazyConnect: true,
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready') {
      await this.client.quit();

      return;
    }

    this.client.disconnect();
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.client.exists(token);

    return exists > 0;
  }

  getClient(): Redis {
    return this.client;
  }
}
