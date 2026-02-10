import { z } from "zod";

export const zGetDeletedPostsTrpcInput = z.object({
  cursor: z.number().optional(),
  limit: z.number().default(10),
});
