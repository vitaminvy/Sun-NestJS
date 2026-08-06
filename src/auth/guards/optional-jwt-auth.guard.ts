import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

import { RedisService } from '../../redis/redis.service';
import { TOKEN_AUTH_SCHEME } from '../auth.constants';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { AuthenticatedRequest } from './jwt-auth.guard';

const OPTIONAL_JWT_GUARD_LOG_CONTEXT = 'OptionalJwtGuard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly i18nService: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      return true;
    }

    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(token)
      .catch((error: unknown) => this.rejectInvalidToken(error));

    const client = this.redisService.getClient();
    const blacklisted = await client.get(token);

    if (blacklisted) {
      throw new UnauthorizedException(
        this.i18nService.t('translation.AUTH.ERRORS.TOKEN_REVOKED'),
      );
    }

    request.user = payload;
    request.token = token;

    return true;
  }

  private rejectInvalidToken(error: unknown): never {
    Logger.warn(
      {
        message:
          'Optional JWT verification failed, so the request was rejected.',
        guidance: 'Ask the client to request a fresh access credential.',
        cause: error instanceof Error ? error.message : String(error),
      },
      OPTIONAL_JWT_GUARD_LOG_CONTEXT,
    );

    throw new UnauthorizedException(
      this.i18nService.t('translation.AUTH.ERRORS.UNAUTHORIZED'),
    );
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== TOKEN_AUTH_SCHEME || !token) {
      return undefined;
    }

    return token;
  }
}
