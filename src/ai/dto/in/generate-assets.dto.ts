import { z } from 'zod';
import { Platform } from '../../enum/platform.enum';

export const generateAssetsSchema = z.object({
  platforms: z
    .array(z.enum(Platform))
    .min(1, 'At least one platform is required'),
  tone: z.string().max(100).optional(),
  lang: z.string().max(10).optional(),
});

export type GenerateAssetsDto = z.infer<typeof generateAssetsSchema>;
