import { z } from "zod";

export const zGetCommunityActionLogTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  limit: z.number().int().min(1).max(50).default(30),
  cursor: z.string().trim().min(1).optional(),
});

export type GetCommunityActionLogTrpcInput = z.infer<
  typeof zGetCommunityActionLogTrpcInput
>;
