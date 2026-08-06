import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';

const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const PRAGMA_HEADER = 'Pragma';
const PRAGMA_VALUE = 'no-cache';
const EXPIRES_HEADER = 'Expires';
const EXPIRES_VALUE = '0';

@Injectable()
export class AntiCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader(CACHE_CONTROL_HEADER, CACHE_CONTROL_VALUE);
    response.setHeader(PRAGMA_HEADER, PRAGMA_VALUE);
    response.setHeader(EXPIRES_HEADER, EXPIRES_VALUE);

    return next.handle();
  }
}

export function useantiCacheHeaders(): MethodDecorator & ClassDecorator {
  return UseInterceptors(AntiCacheInterceptor);
}
