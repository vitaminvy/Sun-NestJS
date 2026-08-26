import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

import { RedisService } from '../../redis/redis.service';
import { TOKEN_AUTH_SCHEME } from '../auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

const JWT_GUARD_LOG_CONTEXT = 'JwtGuard';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly i18nService: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractToken(request);

    if (!token) {
      throw this.createUnauthorizedException();
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

  private createUnauthorizedException(): UnauthorizedException {
    return new UnauthorizedException(
      this.i18nService.t('translation.AUTH.ERRORS.UNAUTHORIZED'),
    );
  }

  private rejectInvalidToken(error: unknown): never {
    Logger.warn(
      {
        message: 'JWT verification failed, so the request was rejected.',
        guidance: 'Ask the client to request a fresh access credential.',
        cause: error instanceof Error ? error.message : String(error),
      },
      JWT_GUARD_LOG_CONTEXT,
    );

    throw this.createUnauthorizedException();
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
