import { cloudinaryUploadTypes } from "@somnia/shared/dist/cloudinary/cloudinary";
import { getKeysAsArray } from "@somnia/shared/dist/cloudinary/getKeysAsArray";
import { z } from "zod";

export const zPrepareCloudinaryUploadTrpcInput = z.object({
  type: z.enum(getKeysAsArray(cloudinaryUploadTypes)),
});
