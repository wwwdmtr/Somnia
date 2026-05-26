import { z } from "zod";

export const zUpadteProfileTrpcInput = z.object({
  nickname: z
    .string("Никнейм не может быть пустым")
    .min(1, "Никнейм не может быть пустым")
    .max(50, "Никнейм слишком длинный")
    .regex(/^[a-z0-9-]+$/, "Никнейм содержит недопустимые символы"),
  name: z.string().max(100, "Имя слишком длинное").default(""),
});
