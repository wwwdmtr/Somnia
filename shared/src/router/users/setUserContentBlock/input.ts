import { z } from "zod";

export const zUserContentBlockTargetType = z.enum(["USER", "COMMUNITY"]);

export const zSetUserContentBlockTrpcInput = z
  .object({
    targetType: zUserContentBlockTargetType,
    targetUserId: z.string().trim().min(1).optional(),
    targetCommunityId: z.string().trim().min(1).optional(),
    isBlocked: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.targetType === "USER") {
      if (!value.targetUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Для блокировки пользователя нужен targetUserId",
          path: ["targetUserId"],
        });
      }

      if (value.targetCommunityId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Для блокировки пользователя нельзя передавать targetCommunityId",
          path: ["targetCommunityId"],
        });
      }

      return;
    }

    if (!value.targetCommunityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для блокировки сообщества нужен targetCommunityId",
        path: ["targetCommunityId"],
      });
    }

    if (value.targetUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для блокировки сообщества нельзя передавать targetUserId",
        path: ["targetUserId"],
      });
    }
  });

export type SetUserContentBlockTrpcInput = z.infer<
  typeof zSetUserContentBlockTrpcInput
>;
