import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { RedisService } from '../../redis/redis.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const client = this.redisService.getClient();
      const blacklisted = await client.get(token);

      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      request.user = payload;
      request.token = token;

      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
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
