import { type UserPermission } from "@prisma/client";

import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isSuperAdmin, isUserAdmin } from "../../utils/can";

import { zSetUserAdminTrpcInput } from "./input";

export const setUserAdminTrpcRoute = trpcLoggedProcedure
  .input(zSetUserAdminTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!isUserAdmin(ctx.me)) {
      throw new Error("Unauthorized");
    }

    if (!input.isAdmin && input.userId === ctx.me!.id) {
      throw new ExpectedError("Нельзя снять с себя права администратора");
    }

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
        nickname: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new ExpectedError("Пользователь не найден");
    }

    const userPermissions = user.permissions as UserPermission[];
    const isAlreadyAdmin = userPermissions.includes("ALL");

    if (!input.isAdmin && isSuperAdmin(user)) {
      throw new ExpectedError(
        `Нельзя снять права у супер-администратора @${user.nickname}`,
      );
    }

    if (isAlreadyAdmin === input.isAdmin) {
      return {
        userId: user.id,
        isAdmin: isAlreadyAdmin,
      };
    }

    const nextPermissions: UserPermission[] = input.isAdmin
      ? [...userPermissions, "ALL"]
      : userPermissions.filter((permission) => permission !== "ALL");

    await ctx.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        permissions: nextPermissions,
      },
    });

    return {
      userId: user.id,
      isAdmin: input.isAdmin,
    };
  });
