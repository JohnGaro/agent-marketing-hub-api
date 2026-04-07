import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Platform } from '../enum/platform.enum';
import { Listing } from '../../listing/entities/listing.entity';

@Entity('generated_assets')
export class GeneratedAsset {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  tone: string;

  @Column({ type: 'text', nullable: true })
  lang: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Listing, (listing) => listing.generatedAssets)
  @JoinColumn()
  listing: Listing;
}
