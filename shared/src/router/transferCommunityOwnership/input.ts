import { z } from "zod";

export const zTransferCommunityOwnershipTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  newOwnerUserId: z.string().trim().min(1),
});

export type TransferCommunityOwnershipTrpcInput = z.infer<
  typeof zTransferCommunityOwnershipTrpcInput
>;
