import { z } from "zod";

export const zGetUserProfileTrpcInput = z.object({
  userId: z.string().trim().min(1),
});
