import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { I18nService } from 'nestjs-i18n';

import type { LocalUploadedFile } from '../../uploads/interfaces/local-uploaded-file.interface';
import {
  AVATAR_MIME_TYPE_EXTENSIONS,
  MAX_AVATAR_FILE_SIZE,
} from '../../uploads/upload.constants';

@Injectable()
export class AvatarFilePipe implements PipeTransform<
  LocalUploadedFile | undefined,
  Promise<LocalUploadedFile | undefined>
> {
  constructor(private readonly i18nService: I18nService) {}

  async transform(
    avatarFile?: LocalUploadedFile,
  ): Promise<LocalUploadedFile | undefined> {
    if (!avatarFile) {
      return undefined;
    }

    if (!AVATAR_MIME_TYPE_EXTENSIONS[avatarFile.mimetype]) {
      return this.rejectAvatarFile(
        avatarFile,
        'translation.USERS.ERRORS.INVALID_AVATAR_TYPE',
      );
    }

    if (avatarFile.size > MAX_AVATAR_FILE_SIZE) {
      return this.rejectAvatarFile(
        avatarFile,
        'translation.USERS.ERRORS.AVATAR_TOO_LARGE',
      );
    }

    return avatarFile;
  }

  private async rejectAvatarFile(
    avatarFile: LocalUploadedFile,
    translationKey: string,
  ): Promise<never> {
    await unlink(avatarFile.path).catch(() => undefined);

    throw new BadRequestException({
      errors: {
        body: [this.i18nService.t(translationKey)],
      },
    });
  }
}
