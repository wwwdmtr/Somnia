import { trpcLoggedProcedure } from "../../lib/trpc";
import { isUserAdmin } from "../../utils/can";

import { zGetAdminReportsTrpcInput } from "./input";

export const getAdminReportsTrpcRoute = trpcLoggedProcedure
  .input(zGetAdminReportsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!isUserAdmin(ctx.me)) {
      throw new Error("Unauthorized");
    }

    const rawReports = await ctx.prisma.report.findMany({
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
        description: true,
        targetType: true,
        status: true,
        handledAt: true,
        resolutionNote: true,
        reporter: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            publisherType: true,
            publisherCommunity: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
        targetUser: {
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
    if (rawReports.length > input.limit) {
      rawReports.pop();
      nextCursor = rawReports[rawReports.length - 1]?.id ?? null;
    }

    return {
      reports: rawReports,
      nextCursor,
    };
  });
