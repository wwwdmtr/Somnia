import { z } from "zod";

export const zGetDeletedPostsTrpcInput = z.object({
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
