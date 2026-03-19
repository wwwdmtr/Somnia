import { cloudinaryUploadTypes } from "@somnia/shared/src/cloudinary/cloudinary";
import { getKeysAsArray } from "@somnia/shared/src/cloudinary/getKeysAsArray";
import { z } from "zod";

export const zPrepareCloudinaryUploadTrpcInput = z.object({
  type: z.enum(getKeysAsArray(cloudinaryUploadTypes)),
});
