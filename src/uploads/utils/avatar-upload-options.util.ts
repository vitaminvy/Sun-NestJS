import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import {
  AVATAR_MIME_TYPE_EXTENSIONS,
  MAX_AVATAR_FILE_SIZE,
  USER_AVATAR_UPLOAD_DIR,
} from '../upload.constants';

export const avatarUploadOptions: MulterOptions = {
  dest: USER_AVATAR_UPLOAD_DIR,
  fileFilter: (_request, file, callback) => {
    if (!AVATAR_MIME_TYPE_EXTENSIONS[file.mimetype]) {
      callback(
        new BadRequestException('avatar must be a gif, jpeg, png or webp'),
        false,
      );

      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_AVATAR_FILE_SIZE,
  },
};
