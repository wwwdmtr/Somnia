import { z } from "zod";

export const setPostLikeTrpcInput = z.object({
  postId: z.string().min(1),
  isLikedByMe: z.boolean(),
});
