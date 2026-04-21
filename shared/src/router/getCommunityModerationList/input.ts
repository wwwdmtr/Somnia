import { z } from "zod";

export const zGetCommunityModerationListTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  list: z.enum(["MODERATORS", "SUBSCRIBERS", "BLACKLIST"]),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().min(1).optional(),
  search: z.string().trim().max(50).optional(),
});

export type GetCommunityModerationListTrpcInput = z.infer<
  typeof zGetCommunityModerationListTrpcInput
>;
