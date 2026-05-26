import { z } from "zod";

export const zGetRatedPostsTrpcInput = z.object({
  cursor: z.number().optional(),
  limit: z.number().default(10),
  period: z.enum(["day", "week", "month", "all"]).default("week"),
  search: z.string().optional(),
});

export type GetRatedPostsTrpcInput = z.infer<typeof zGetRatedPostsTrpcInput>;
