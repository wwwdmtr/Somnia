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

export const zSetCommunityAvatarTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  avatar: zAvatarPublicId.nullable(),
});

export type SetCommunityAvatarTrpcInput = z.infer<
  typeof zSetCommunityAvatarTrpcInput
>;
