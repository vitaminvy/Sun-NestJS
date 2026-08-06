import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

import { RedisService } from '../../redis/redis.service';

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_KEY_PREFIX = 'login-attempts';

interface LoginRateLimitRequest extends Request {
  body: {
    user?: {
      email?: string;
    };
  };
}

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly i18nService: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRateLimitRequest>();
    const identifier = this.getRateLimitIdentifier(request);
    const client = this.redisService.getClient();
    const key = `${LOGIN_RATE_LIMIT_KEY_PREFIX}:${identifier}`;
    const attempts = await client.incr(key);

    if (attempts === 1) {
      await client.expire(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (attempts > LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException(
        {
          errors: {
            body: [
              this.i18nService.t(
                'translation.AUTH.ERRORS.TOO_MANY_LOGIN_ATTEMPTS',
              ),
            ],
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getRateLimitIdentifier(request: LoginRateLimitRequest): string {
    const email = request.body?.user?.email?.trim().toLowerCase();

    if (email) {
      return email;
    }

    return request.ip ?? 'unknown';
  }
}
