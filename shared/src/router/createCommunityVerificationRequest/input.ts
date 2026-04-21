import { z } from "zod";

export const zCreateCommunityVerificationRequestTrpcInput = z.object({
  communityId: z.string().trim().min(1),
  contact: z
    .string()
    .trim()
    .min(3, "Контакт должен быть от 3 до 200 символов")
    .max(200, "Контакт должен быть от 3 до 200 символов"),
});

export type CreateCommunityVerificationRequestTrpcInput = z.infer<
  typeof zCreateCommunityVerificationRequestTrpcInput
>;
