import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Listing } from '../entities/listing.entity';
import { ListingPhoto } from '../entities/listing-photo.entity';
import { CreateListingDto } from '../dto/in/create-listing.dto';
import { UpdateListingDto } from '../dto/in/update-listing.dto';
import { ListingStatus } from '../enums/listing-status.enum';
import { ListingCreatedEvent } from '../events/listing-created.event';

@Injectable()
export class ListingService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly photoRepository: Repository<ListingPhoto>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateListingDto): Promise<Listing> {
    const { photos, ...listingData } = dto;

    const listing = this.listingRepository.create({
      ...listingData,
      status: ListingStatus.PUBLISHED,
    });
    const saved = await this.listingRepository.save(listing);

    if (photos?.length) {
      const photoEntities = photos.map((photo, index) =>
        this.photoRepository.create({
          ...photo,
          position: photo.position ?? index,
          listing: saved,
        }),
      );
      saved.photos = await this.photoRepository.save(photoEntities);
    } else {
      saved.photos = [];
    }

    this.eventEmitter.emit(
      'listing.created',
      new ListingCreatedEvent(saved.uuid),
    );

    return saved;
  }

  async findAll(): Promise<Listing[]> {
    return this.listingRepository.find({
      relations: ['photos'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { uuid: id },
      relations: ['photos'],
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    return listing;
  }

  async update(id: string, dto: UpdateListingDto): Promise<Listing> {
    const listing = await this.findOne(id);
    const { photos, ...listingData } = dto;

    Object.assign(listing, listingData);
    await this.listingRepository.save(listing);

    if (photos !== undefined) {
      await this.photoRepository.delete({ listing: { uuid: id } });

      if (photos.length) {
        const photoEntities = photos.map((p, index) =>
          this.photoRepository.create({
            ...p,
            position: p.position ?? index,
            listing,
          }),
        );
        listing.photos = await this.photoRepository.save(photoEntities);
      } else {
        listing.photos = [];
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const listing = await this.findOne(id);
    await this.listingRepository.remove(listing);
  }
}
