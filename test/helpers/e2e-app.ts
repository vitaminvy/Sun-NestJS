import { NestExpressApplication } from '@nestjs/platform-express';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { mkdirSync } from 'node:fs';

import { formatI18nValidationErrors } from '../../src/common/i18n/i18n-validation-error-formatter';
import {
  PUBLIC_ROOT,
  PUBLIC_URL_PREFIX,
  USER_AVATAR_UPLOAD_DIR,
} from '../../src/uploads/upload.constants';

export const configureE2eApp = (app: NestExpressApplication): void => {
  mkdirSync(USER_AVATAR_UPLOAD_DIR, { recursive: true });

  app.setGlobalPrefix('api');
  app.useStaticAssets(PUBLIC_ROOT, {
    prefix: `${PUBLIC_URL_PREFIX}/`,
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      errorFormatter: formatI18nValidationErrors,
    }),
  );
};
