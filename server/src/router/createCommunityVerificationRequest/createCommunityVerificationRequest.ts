import { notifyAdmins } from "../../lib/adminNotifications";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zCreateCommunityVerificationRequestTrpcInput } from "./input";

export const createCommunityVerificationRequestTrpcRoute = trpcLoggedProcedure
  .input(zCreateCommunityVerificationRequestTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const community = await ctx.prisma.community.findUnique({
      where: {
        id: input.communityId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (community.ownerId !== ctx.me.id) {
      throw new ExpectedError(
        "Только владелец сообщества может отправить заявку на верификацию",
      );
    }

    const duplicateRequest =
      await ctx.prisma.communityVerificationRequest.findFirst({
        where: {
          communityId: input.communityId,
          status: {
            in: ["OPEN", "IN_REVIEW"],
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateRequest) {
      throw new ExpectedError(
        "Заявка на верификацию уже отправлена и находится в обработке",
      );
    }

    const request = await ctx.prisma.$transaction(async (tx) => {
      const createdRequest = await tx.communityVerificationRequest.create({
        data: {
          communityId: input.communityId,
          requesterUserId: ctx.me!.id,
          contact: input.contact.trim(),
        },
        select: {
          id: true,
          status: true,
        },
      });

      await notifyAdmins({
        prisma: tx,
        actorUserId: ctx.me!.id,
        type: "ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST",
        communityId: input.communityId,
        details: {
          communityVerificationRequestId: createdRequest.id,
        },
      });

      return createdRequest;
    });

    return {
      requestId: request.id,
      status: request.status,
    };
  });
