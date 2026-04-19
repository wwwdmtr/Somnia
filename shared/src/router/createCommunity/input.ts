import { z } from "zod";

export const zCreateCommunityTrpcInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя сообщества должно быть не короче 2 символов")
    .max(60, "Имя сообщества должно быть не длиннее 60 символов"),
  description: z
    .string()
    .trim()
    .max(600, "Описание сообщества должно быть не длиннее 600 символов")
    .default(""),
  avatar: z.string().trim().min(1).nullable().optional(),
});

export type CreateCommunityTrpcInput = z.infer<typeof zCreateCommunityTrpcInput>;
