import { z } from "zod";

export const zSignUpTrpcInput = z.object({
  nickname: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      "Nickname can only contain lowercase letters, numbers, and hyphens.",
    ),
  password: z.string().min(6).max(100),
});
