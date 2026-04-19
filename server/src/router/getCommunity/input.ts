import { z } from "zod";

export const zGetCommunityTrpcInput = z.object({
  id: z.string().trim().min(1),
});
