import { PropertyType } from '../../enums/property-type.enum';
import { Orientation } from '../../enums/orientation.enum';
import { EnergyClass } from '../../enums/energy-class.enum';
import { PropertyCondition } from '../../enums/property-condition.enum';
import { HeatingType } from '../../enums/heating-type.enum';
import { ListingStatus } from '../../enums/listing-status.enum';

export class ListingPhotoResponseDto {
  id: string;
  url: string;
  caption: string | null;
  position: number;
  createdAt: Date;
}

export class ListingResponseDto {
  id: string;
  propertyType: PropertyType;
  address: string;
  neighborhood: string | null;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: string | null;
  orientation: Orientation | null;
  hasElevator: boolean;
  hasBalcony: boolean;
  balconySurface: number | null;
  hasGarden: boolean;
  gardenSurface: number | null;
  energyClass: EnergyClass | null;
  condition: PropertyCondition | null;
  heatingType: HeatingType | null;
  description: string | null;
  improvements: string | null;
  notes: string | null;
  status: ListingStatus;
  photos: ListingPhotoResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
