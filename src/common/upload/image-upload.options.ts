import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 10, parts: 11 },
};
