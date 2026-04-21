import { z } from "zod";

export const zGetAdminCommunityVerificationRequestsTrpcInput = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export type GetAdminCommunityVerificationRequestsTrpcInput = z.infer<
  typeof zGetAdminCommunityVerificationRequestsTrpcInput
>;
