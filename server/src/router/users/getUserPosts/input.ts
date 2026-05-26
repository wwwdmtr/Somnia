import { z } from "zod";

export const zGetUserPostsTrpcInput = z.object({
  userId: z.string().trim().min(1),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).default(15),
});
