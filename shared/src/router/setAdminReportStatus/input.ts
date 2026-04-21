import { z } from "zod";

export const zReportStatus = z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]);

export const zSetAdminReportStatusTrpcInput = z.object({
  reportId: z.string().trim().min(1),
  status: zReportStatus,
  resolutionNote: z.string().trim().max(500).optional(),
});

export type SetAdminReportStatusTrpcInput = z.infer<
  typeof zSetAdminReportStatusTrpcInput
>;
