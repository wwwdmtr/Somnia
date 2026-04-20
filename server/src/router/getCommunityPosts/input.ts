import { z } from "zod";

export const zGetCommunityPostsTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
