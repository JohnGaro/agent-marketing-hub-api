import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity()
export class ListingPhoto {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Listing, (listing) => listing.photos)
  @JoinColumn()
  listing: Listing;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
