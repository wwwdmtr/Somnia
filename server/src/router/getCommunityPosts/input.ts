import { z } from "zod";

export const zGetCommunityPostsTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  cursor: z.number().optional(),
  limit: z.number().default(10),
});
