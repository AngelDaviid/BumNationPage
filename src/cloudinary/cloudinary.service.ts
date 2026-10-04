import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import 'multer';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'bum-nation/products',
          allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
          transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message));
          }

          if (!result) {
            return reject(new Error('Error al enviar la imagen a Cloudinary'));
          }

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  // Respaldo para imágenes subidas antes de guardar el public_id:
  // .../image/upload/v123/bum-nation/products/abc.jpg -> bum-nation/products/abc
  getPublicIdFromUrl(url: string): string | null {
    const path = url.split('?')[0].split('/upload/')[1];
    if (!path) return null;

    const segments = path.split('/');
    const versionIndex = segments.findIndex((s) => /^v\d+$/.test(s));
    const idSegments =
      versionIndex >= 0
        ? segments.slice(versionIndex + 1)
        : segments.filter((s) => !s.includes(','));

    const publicId = idSegments.join('/').replace(/\.[a-z0-9]+$/i, '');
    return publicId || null;
  }
}
