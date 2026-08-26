import { Injectable } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class AccessCredentialRepository {
  constructor(private readonly redisService: RedisService) {}

  async saveDisabledCredential(
    credential: string,
    ttlSeconds: number,
  ): Promise<void> {
    const client = this.redisService.getClient();

    await client.set(credential, 'disabled', 'EX', ttlSeconds);
  }
}
