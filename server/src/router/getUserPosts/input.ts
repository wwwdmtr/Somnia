import { z } from "zod";

export const zGetUserPostsTrpcInput = z.object({
  userId: z.string().trim().min(1),
});
