import { z } from "zod";

export const zReportTargetType = z.enum(["POST", "USER"]);

export const zCreateReportTrpcInput = z
  .object({
    targetType: zReportTargetType,
    postId: z.string().trim().min(1).optional(),
    targetUserId: z.string().trim().min(1).optional(),
    description: z
      .string()
      .trim()
      .min(10, "Текст жалобы должен быть от 10 до 500 символов")
      .max(500, "Текст жалобы должен быть от 10 до 500 символов"),
  })
  .superRefine((value, ctx) => {
    if (value.targetType === "POST") {
      if (!value.postId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Для жалобы на пост нужен postId",
          path: ["postId"],
        });
      }

      if (value.targetUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Для жалобы на пост нельзя передавать targetUserId",
          path: ["targetUserId"],
        });
      }

      return;
    }

    if (!value.targetUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для жалобы на пользователя нужен targetUserId",
        path: ["targetUserId"],
      });
    }

    if (value.postId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для жалобы на пользователя нельзя передавать postId",
        path: ["postId"],
      });
    }
  });

export type CreateReportTrpcInput = z.infer<typeof zCreateReportTrpcInput>;
