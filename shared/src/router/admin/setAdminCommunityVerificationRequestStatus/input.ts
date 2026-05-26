import { z } from "zod";

export const zCommunityVerificationRequestStatus = z.enum([
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
]);

export const zSetAdminCommunityVerificationRequestStatusTrpcInput = z.object({
  requestId: z.string().trim().min(1),
  status: zCommunityVerificationRequestStatus,
});

export type SetAdminCommunityVerificationRequestStatusTrpcInput = z.infer<
  typeof zSetAdminCommunityVerificationRequestStatusTrpcInput
>;
