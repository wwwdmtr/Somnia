import { trpcLoggedProcedure } from "../../lib/trpc";
import { isUserAdmin } from "../../utils/can";

import { zGetAdminCommunityVerificationRequestsTrpcInput } from "./input";

export const getAdminCommunityVerificationRequestsTrpcRoute =
  trpcLoggedProcedure
    .input(zGetAdminCommunityVerificationRequestsTrpcInput)
    .query(async ({ ctx, input }) => {
      if (!isUserAdmin(ctx.me)) {
        throw new Error("Unauthorized");
      }

      const rawRequests =
        await ctx.prisma.communityVerificationRequest.findMany({
          take: input.limit + 1,
          ...(input.cursor
            ? {
                cursor: {
                  id: input.cursor,
                },
                skip: 1,
              }
            : {}),
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            contact: true,
            status: true,
            handledAt: true,
            community: {
              select: {
                id: true,
                name: true,
              },
            },
            requester: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
            handledBy: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        });

      let nextCursor: string | null = null;
      if (rawRequests.length > input.limit) {
        rawRequests.pop();
        nextCursor = rawRequests[rawRequests.length - 1]?.id ?? null;
      }

      return {
        requests: rawRequests,
        nextCursor,
      };
    });
