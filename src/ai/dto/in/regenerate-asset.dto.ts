import { z } from 'zod';

export const regenerateAssetSchema = z.object({
  tone: z.string().max(100).optional(),
  lang: z.string().max(10).optional(),
});

export type RegenerateAssetDto = z.infer<typeof regenerateAssetSchema>;
