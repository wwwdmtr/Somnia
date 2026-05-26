import { z } from "zod";

export const zSignUpTrpcInput = z.object({
  nickname: z
    .string({ message: "Никнейм не может быть пустым" })
    .trim()
    .min(3, "Никнейм должен быть не менее 3 символов")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Никнейм содержит недопустимые символы.")
    .prefault(""),
  email: z
    .string()
    .trim()
    .min(1, "Почта не может быть пустой")
    .check(z.email("Некорректная почта"))
    .prefault(""),
  password: z
    .string({ message: "Пароль не может быть пустым" })
    .min(6, "Пароль должен содержать минимум 6 символов")
    .max(100)
    .prefault(""),
});
