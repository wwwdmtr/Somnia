import { z } from 'zod';

const zPostImages = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Некорректный идентификатор изображения')
      .max(255, 'Слишком длинный идентификатор изображения')
      .regex(/^[a-zA-Z0-9/_-]+$/, 'Некорректный идентификатор изображения')
      .refine(
        (imagePublicId) => imagePublicId.startsWith('images/'),
        'Изображение должно быть в папке images',
      ),
  )
  .max(10, 'Можно прикрепить не больше 10 изображений')
  .default([]);

export const zCreatePostTrpcInput = z.object({
  title: z.string().trim().default(''),
  description: z.string().trim().default(''),
  text: z.string().trim().default(''),
  images: zPostImages,
  communityId: z.string().trim().min(1).optional(),
});
