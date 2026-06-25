import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Base de datos
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
