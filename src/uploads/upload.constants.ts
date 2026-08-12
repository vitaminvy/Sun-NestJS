import { join } from 'node:path';

export const PUBLIC_URL_PREFIX = '/public';
export const PUBLIC_ROOT = join(process.cwd(), 'public');
export const USER_AVATAR_UPLOAD_DIR = join(PUBLIC_ROOT, 'uploads', 'avatars');
export const USER_AVATAR_PUBLIC_URL_PREFIX = `${PUBLIC_URL_PREFIX}/uploads/avatars`;
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

export const AVATAR_MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
