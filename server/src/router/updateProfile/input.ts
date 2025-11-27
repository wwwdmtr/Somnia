import { z } from "zod";

export const zUpadteProfileTrpcInput = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Nickname can only contain lowercase letters, numbers, and dashes",
    ),
  name: z.string().max(100, "Name is too long").default(""),
});
