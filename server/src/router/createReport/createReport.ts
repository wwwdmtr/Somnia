import { notifyAdmins } from "../../lib/adminNotifications";
import { isCommunityManagerRole } from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zCreateReportTrpcInput } from "./input";

export const createReportTrpcRoute = trpcLoggedProcedure
  .input(zCreateReportTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    if (input.targetType === "POST") {
      const post = await ctx.prisma.post.findUnique({
        where: {
          id: input.postId!,
        },
        select: {
          id: true,
          authorId: true,
          publisherType: true,
          publisherCommunityId: true,
          deletedAt: true,
        },
      });

      if (!post || post.deletedAt) {
        throw new ExpectedError("Пост не найден");
      }

      if (post.authorId === ctx.me.id) {
        throw new ExpectedError("Нельзя жаловаться на собственный пост");
      }

      if (post.publisherType === "COMMUNITY" && post.publisherCommunityId) {
        const [community, myMembership] = await Promise.all([
          ctx.prisma.community.findUnique({
            where: {
              id: post.publisherCommunityId,
            },
            select: {
              ownerId: true,
            },
          }),
          ctx.prisma.communityMember.findUnique({
            where: {
              communityId_userId: {
                communityId: post.publisherCommunityId,
                userId: ctx.me.id,
              },
            },
            select: {
              role: true,
            },
          }),
        ]);

        if (
          community &&
          (community.ownerId === ctx.me.id ||
            isCommunityManagerRole(myMembership?.role ?? null))
        ) {
          throw new ExpectedError(
            "Нельзя пожаловаться на пост сообщества, которым вы управляете",
          );
        }
      }

      const duplicateReport = await ctx.prisma.report.findFirst({
        where: {
          reporterUserId: ctx.me.id,
          targetType: "POST",
          postId: post.id,
          status: {
            in: ["OPEN", "IN_REVIEW"],
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateReport) {
        throw new ExpectedError(
          "Жалоба уже отправлена и находится в обработке",
        );
      }

      const report = await ctx.prisma.$transaction(async (tx) => {
        const createdReport = await tx.report.create({
          data: {
            reporterUserId: ctx.me!.id,
            targetType: "POST",
            postId: post.id,
            description: input.description.trim(),
          },
          select: {
            id: true,
            status: true,
          },
        });

        await notifyAdmins({
          prisma: tx,
          actorUserId: ctx.me!.id,
          type: "ADMIN_NEW_REPORT",
          postId: post.id,
          details: {
            reportId: createdReport.id,
            targetType: "POST",
          },
        });

        return createdReport;
      });

      return {
        reportId: report.id,
        status: report.status,
      };
    }

    const targetUserId = input.targetUserId!;

    if (targetUserId === ctx.me.id) {
      throw new ExpectedError("Нельзя пожаловаться на самого себя");
    }

    const targetUser = await ctx.prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
      },
    });

    if (!targetUser) {
      throw new ExpectedError("Пользователь не найден");
    }

    const duplicateReport = await ctx.prisma.report.findFirst({
      where: {
        reporterUserId: ctx.me.id,
        targetType: "USER",
        targetUserId,
        status: {
          in: ["OPEN", "IN_REVIEW"],
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateReport) {
      throw new ExpectedError("Жалоба уже отправлена и находится в обработке");
    }

    const report = await ctx.prisma.$transaction(async (tx) => {
      const createdReport = await tx.report.create({
        data: {
          reporterUserId: ctx.me!.id,
          targetType: "USER",
          targetUserId,
          description: input.description.trim(),
        },
        select: {
          id: true,
          status: true,
        },
      });

      await notifyAdmins({
        prisma: tx,
        actorUserId: ctx.me!.id,
        type: "ADMIN_NEW_REPORT",
        details: {
          reportId: createdReport.id,
          targetType: "USER",
        },
      });

      return createdReport;
    });

    return {
      reportId: report.id,
      status: report.status,
    };
  });
