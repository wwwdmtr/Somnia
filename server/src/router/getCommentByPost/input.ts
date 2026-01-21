import { z } from "zod";

export const zGetCommentsByPostTrpcInput = z.object({
  postId: z.string(),
  cursor: z.string().optional(),
  limit: z.number().default(20),
});
