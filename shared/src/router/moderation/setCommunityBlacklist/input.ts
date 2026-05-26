import { z } from "zod";

export const zCommunityBlacklistDuration = z.enum([
  "PERMANENT",
  "DAY",
  "WEEK",
  "MONTH",
]);

export const zSetCommunityBlacklistTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  isBlocked: z.boolean(),
  duration: zCommunityBlacklistDuration.optional(),
});

export type SetCommunityBlacklistTrpcInput = z.infer<
  typeof zSetCommunityBlacklistTrpcInput
>;
