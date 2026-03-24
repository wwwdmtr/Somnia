import { z } from "zod";

const zPostImages = z
  .array(z.string().trim().min(1, "Некорректный идентификатор изображения"))
  .max(10, "Можно прикрепить не больше 10 изображений")
  .default([]);

export const zCreatePostTrpcInput = z.object({
  title: z
    .string({ message: "Заголовок не может быть пустым" })
    .trim()
    .min(1, "Заголовок не может быть пустым"),
  description: z.string({ message: "Описание не может быть пустым" }).trim(),
  text: z
    .string({ message: "Текст не может быть пустым" })
    .trim()
    .min(100, "Текст должен содержать минимум 100 символов"),
  images: zPostImages,
});
