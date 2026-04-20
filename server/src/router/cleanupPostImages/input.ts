import { z } from "zod";

export const zCleanupPostImagesTrpcInput = z.object({
  imagePublicIds: z
    .array(z.string().trim().min(1, "Некорректный идентификатор изображения"))
    .max(20, "Слишком много изображений"),
});
