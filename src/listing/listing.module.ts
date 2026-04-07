import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './entities/listing.entity';
import { ListingPhoto } from './entities/listing-photo.entity';
import { ListingController } from './controllers/listing.controller';
import { ListingService } from './services/listing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, ListingPhoto])],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
