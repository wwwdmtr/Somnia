import { z } from "zod";

export const zGetSubscribedPostsTrpcInput = z.object({
  cursor: z.number().optional(),
  limit: z.number().default(10),
});
