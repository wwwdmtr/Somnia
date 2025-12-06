import { z } from "zod";

export const zSignUpTrpcInput = z.object({
  nickname: z
    .string({ message: "Никнейм не может быть пустым" })
    .min(3, "Никнейм должен быть не менее 3 символов")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Никнейм содержит недопустимые символы."),
  password: z
    .string({ message: "Пароль не может быть пустым" })
    .min(6, "Пароль должен содержать минимум 6 символов")
    .max(100),
});
