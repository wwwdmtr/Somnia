import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isUserAdmin } from "../../utils/can";

import { zSetAdminReportStatusTrpcInput } from "./input";

export const setAdminReportStatusTrpcRoute = trpcLoggedProcedure
  .input(zSetAdminReportStatusTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!isUserAdmin(ctx.me)) {
      throw new Error("Unauthorized");
    }

    const report = await ctx.prisma.report.findUnique({
      where: {
        id: input.reportId,
      },
      select: {
        id: true,
      },
    });

    if (!report) {
      throw new ExpectedError("Жалоба не найдена");
    }

    const isOpen = input.status === "OPEN";

    await ctx.prisma.report.update({
      where: {
        id: input.reportId,
      },
      data: {
        status: input.status,
        handledByUserId: isOpen ? null : ctx.me!.id,
        handledAt: isOpen ? null : new Date(),
        resolutionNote: isOpen ? null : (input.resolutionNote?.trim() ?? null),
      },
    });

    return {
      reportId: input.reportId,
      status: input.status,
    };
  });
