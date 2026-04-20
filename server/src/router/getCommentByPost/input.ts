import { z } from "zod";

export const zGetCommentsByPostTrpcInput = z.object({
  postId: z.string().trim().min(1),
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
