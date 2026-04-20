import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSearchCommunitiesTrpcInput } from "./input";

export const searchCommunitiesTrpcRoute = trpcLoggedProcedure
  .input(zSearchCommunitiesTrpcInput)
  .query(async ({ ctx, input }) => {
    const normalizedSearch = input.search.trim();
    if (!normalizedSearch) {
      return { communities: [] };
    }

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
