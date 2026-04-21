import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSearchCommunitiesTrpcInput } from "./input";

export const searchCommunitiesTrpcRoute = trpcLoggedProcedure
  .input(zSearchCommunitiesTrpcInput)
  .query(async ({ ctx, input }) => {
    const normalizedSearch = input.search.trim();
    if (!normalizedSearch) {
      return { communities: [] };
    }
    const now = new Date();

    const communities = await ctx.prisma.community.findMany({
      where: {
        OR: [
          {
            name: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        ],
        ...(ctx.me
          ? {
              AND: [
                {
                  blockedByUsers: {
                    none: {
                      userId: ctx.me.id,
                    },
                  },
                },
                {
                  blacklistEntries: {
                    none: {
                      userId: ctx.me.id,
                      OR: [
                        {
                          expiresAt: null,
                        },
                        {
                          expiresAt: {
                            gt: now,
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
      },
      take: input.limit,
    });

    return { communities };
  });
