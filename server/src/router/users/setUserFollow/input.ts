import { z } from "zod";

export const zSetUserFollowTrpcInput = z.object({
  userId: z.string().trim().min(1),
  isFollowing: z.boolean(),
});
