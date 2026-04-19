import { trpcLoggedProcedure } from "../../lib/trpc";

const ROLE_WEIGHT: Record<"OWNER" | "MODERATOR" | "MEMBER", number> = {
  OWNER: 0,
  MODERATOR: 1,
  MEMBER: 2,
};

export const getMyPublishingIdentitiesTrpcRoute = trpcLoggedProcedure.query(
  async ({ ctx }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const [me, memberships] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { id: ctx.me.id },
        select: {
          id: true,
          nickname: true,
          name: true,
          avatar: true,
        },
      }),
      ctx.prisma.communityMember.findMany({
        where: {
          userId: ctx.me.id,
          role: {
            in: ["OWNER", "MODERATOR"],
          },
        },
        select: {
          role: true,
          community: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    if (!me) {
      throw new Error("Unauthorized");
    }

    const communities = memberships
      .map((membership) => ({
        id: membership.community.id,
        name: membership.community.name,
        avatar: membership.community.avatar,
        role: membership.role,
      }))
      .sort((a, b) => {
        if (ROLE_WEIGHT[a.role] !== ROLE_WEIGHT[b.role]) {
          return ROLE_WEIGHT[a.role] - ROLE_WEIGHT[b.role];
        }

        return a.name.localeCompare(b.name);
      });

    return {
      me,
      communities,
    };
  },
);
