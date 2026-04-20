import { z } from "zod";

const zAvatarPublicId = z
  .string("Некорректный идентификатор аватарки")
  .trim()
  .min(1, "Некорректный идентификатор аватарки")
  .max(255, "Слишком длинный идентификатор аватарки")
  .regex(/^[a-zA-Z0-9/_-]+$/, "Некорректный идентификатор аватарки")
  .refine(
    (avatar) => avatar.startsWith("avatars/"),
    "Аватарка должна быть в папке avatars",
  );

export const zCreateCommunityTrpcInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя сообщества должно быть не короче 2 символов")
    .max(60, "Имя сообщества должно быть не длиннее 60 символов")
    .prefault(""),
  description: z
    .string()
    .trim()
    .max(600, "Описание сообщества должно быть не длиннее 600 символов")
    .default(""),
  avatar: zAvatarPublicId.nullable().optional(),
});

export type CreateCommunityTrpcInput = z.infer<typeof zCreateCommunityTrpcInput>;
