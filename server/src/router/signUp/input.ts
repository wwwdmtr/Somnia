import { z } from "zod";

export const zSignUpTrpcInput = z.object({
  nickname: z
    .string({ message: "Nickname is required" })
    .min(3, "Nickname must be atleast 3 characters long")
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      "Nickname can only contain lowercase letters, numbers, and hyphens.",
    ),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be atleast 6 characters long")
    .max(100),
});
