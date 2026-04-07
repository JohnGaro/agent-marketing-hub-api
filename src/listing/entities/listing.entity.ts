import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyType } from '../enums/property-type.enum';
import { Orientation } from '../enums/orientation.enum';
import { EnergyClass } from '../enums/energy-class.enum';
import { PropertyCondition } from '../enums/property-condition.enum';
import { HeatingType } from '../enums/heating-type.enum';
import { ListingStatus } from '../enums/listing-status.enum';
import { ListingPhoto } from './listing-photo.entity';
import { GeneratedAsset } from '../../ai/entities/generated-asset.entity';

@Entity()
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @OneToMany(() => ListingPhoto, (photo) => photo.listing)
  photos: ListingPhoto[];

  @OneToMany(() => GeneratedAsset, (asset) => asset.listing)
  generatedAssets: GeneratedAsset[];

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  neighborhood: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  surface: number;

  @Column({ type: 'int' })
  rooms: number;

  @Column({ type: 'int' })
  bedrooms: number;

  @Column({ type: 'int' })
  bathrooms: number;

  @Column({ type: 'varchar', nullable: true })
  floor: string | null;

  @Column({ type: 'enum', enum: Orientation, nullable: true })
  orientation: Orientation | null;

  @Column({ type: 'boolean', default: false })
  hasElevator: boolean;

  @Column({ type: 'boolean', default: false })
  hasBalcony: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balconySurface: number | null;

  @Column({ type: 'boolean', default: false })
  hasGarden: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gardenSurface: number | null;

  @Column({ type: 'enum', enum: EnergyClass, nullable: true })
  energyClass: EnergyClass | null;

  @Column({ type: 'enum', enum: PropertyCondition, nullable: true })
  condition: PropertyCondition | null;

  @Column({ type: 'enum', enum: HeatingType, nullable: true })
  heatingType: HeatingType | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  improvements: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.DRAFT })
  status: ListingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
