import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import type ms from 'ms';

const JWT_SIGNING_KEY_OPTION = 'secret';

class JwtConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtConfigurationError';
  }
}

export function createJwtModuleOptions(
  configService: ConfigService,
): JwtModuleOptions {
  const signingKey = configService.get<string>('JWT_SECRET')?.trim();

  if (!signingKey) {
    throw new JwtConfigurationError(
      'JWT_SECRET must be set before JWT tokens can be signed or verified.',
    );
  }

  const expiresIn = configService.get<ms.StringValue>('JWT_EXPIRES_IN', '1d');

  return {
    [JWT_SIGNING_KEY_OPTION]: signingKey,
    signOptions: {
      expiresIn,
    },
  };
}
