import { z } from "zod";

export const zGetCommunityModerationTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  search: z.string().trim().max(50).optional(),
});

export type GetCommunityModerationTrpcInput = z.infer<
  typeof zGetCommunityModerationTrpcInput
>;
