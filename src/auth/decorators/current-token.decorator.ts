import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

export const CurrentToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.token!;
  },
);
