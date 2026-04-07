import { z } from 'zod';
import { PropertyType } from '../../enums/property-type.enum';
import { Orientation } from '../../enums/orientation.enum';
import { EnergyClass } from '../../enums/energy-class.enum';
import { PropertyCondition } from '../../enums/property-condition.enum';
import { HeatingType } from '../../enums/heating-type.enum';

export const createListingPhotoSchema = z.object({
  url: z.url(),
  caption: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

export const createListingSchema = z.object({
  propertyType: z.enum(PropertyType),
  address: z.string().min(1),
  neighborhood: z.string().optional(),
  price: z.number().min(0),
  surface: z.number().min(0),
  rooms: z.number().int().min(0),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  floor: z.string().optional(),
  orientation: z.enum(Orientation).optional(),
  hasElevator: z.boolean().optional(),
  hasBalcony: z.boolean().optional(),
  balconySurface: z.number().min(0).optional(),
  hasGarden: z.boolean().optional(),
  gardenSurface: z.number().min(0).optional(),
  energyClass: z.enum(EnergyClass).optional(),
  condition: z.enum(PropertyCondition).optional(),
  heatingType: z.enum(HeatingType).optional(),
  notes: z.string().optional(),
  photos: z.array(createListingPhotoSchema).optional(),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
export type CreateListingPhotoDto = z.infer<typeof createListingPhotoSchema>;
