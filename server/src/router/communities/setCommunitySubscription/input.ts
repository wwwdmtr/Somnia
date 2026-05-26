import { z } from "zod";

export const zSetCommunitySubscriptionTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  isSubscribed: z.boolean(),
});
