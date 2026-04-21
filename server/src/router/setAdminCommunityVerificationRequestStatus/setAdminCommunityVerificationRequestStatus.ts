import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isUserAdmin } from "../../utils/can";

import { zSetAdminCommunityVerificationRequestStatusTrpcInput } from "./input";

export const setAdminCommunityVerificationRequestStatusTrpcRoute =
  trpcLoggedProcedure
    .input(zSetAdminCommunityVerificationRequestStatusTrpcInput)
    .mutation(async ({ ctx, input }) => {
      if (!isUserAdmin(ctx.me)) {
        throw new Error("Unauthorized");
      }

      const request = await ctx.prisma.communityVerificationRequest.findUnique({
        where: {
          id: input.requestId,
        },
        select: {
          id: true,
          communityId: true,
        },
      });

      if (!request) {
        throw new ExpectedError("Заявка на верификацию не найдена");
      }

      const isOpen = input.status === "OPEN";

      await ctx.prisma.$transaction(async (tx) => {
        await tx.communityVerificationRequest.update({
          where: {
            id: input.requestId,
          },
          data: {
            status: input.status,
            handledByUserId: isOpen ? null : ctx.me!.id,
            handledAt: isOpen ? null : new Date(),
          },
        });

        const resolvedRequestsCount =
          await tx.communityVerificationRequest.count({
            where: {
              communityId: request.communityId,
              status: "RESOLVED",
            },
          });

        await tx.community.update({
          where: {
            id: request.communityId,
          },
          data: {
            isVerified: resolvedRequestsCount > 0,
          },
        });
      });

      return {
        requestId: input.requestId,
        status: input.status,
      };
    });
