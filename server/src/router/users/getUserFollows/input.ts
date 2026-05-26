import { z } from "zod";

export const zGetUserFollowsTrpcInput = z.object({
  userId: z.string().trim().min(1),
  type: z.enum(["followers", "following"]),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
