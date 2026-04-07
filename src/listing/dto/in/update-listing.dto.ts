import { z } from 'zod';
import { createListingSchema } from './create-listing.dto';
import { ListingStatus } from '../../enums/listing-status.enum';

export const updateListingSchema = createListingSchema.partial().extend({
  description: z.string().optional(),
  improvements: z.string().optional(),
  status: z.enum(ListingStatus).optional(),
});

export type UpdateListingDto = z.infer<typeof updateListingSchema>;
