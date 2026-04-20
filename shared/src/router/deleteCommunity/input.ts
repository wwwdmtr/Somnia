import { z } from "zod";

export const zDeleteCommunityTrpcInput = z.object({
  communityId: z.string().trim().min(1),
});

export type DeleteCommunityTrpcInput = z.infer<
  typeof zDeleteCommunityTrpcInput
>;
