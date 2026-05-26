import { z } from "zod";

export const zSetCommunityModeratorTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  isModerator: z.boolean(),
});

export type SetCommunityModeratorTrpcInput = z.infer<
  typeof zSetCommunityModeratorTrpcInput
>;
