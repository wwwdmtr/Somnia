import { z } from "zod";

export const zGetPostsTrpcInput = z.object({
  cursor: z.number().optional(),
  limit: z.number().default(10),
});
