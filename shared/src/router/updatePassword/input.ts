import { z } from "zod";

export const zUpdatePasswordTrpcInput = z.object({
  currentPassword: z
    .string()
    .min(8, "Текущий пароль должен содержать минимум 8 символов")
    .prefault(""),
  newPassword: z
    .string()
    .min(8, "Новый пароль должен содержать минимум 8 символов")
    .prefault(""),
});
