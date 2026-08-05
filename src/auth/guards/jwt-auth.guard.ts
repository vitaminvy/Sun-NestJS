import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

import { RedisService } from '../../redis/redis.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw this.createUnauthorizedException();
    }

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

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Token' || !token) {
      return undefined;
    }

    return token;
  }
}
