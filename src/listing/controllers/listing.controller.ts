import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ListingService } from '../services/listing.service';
import { createListingSchema } from '../dto/in/create-listing.dto';
import type { CreateListingDto } from '../dto/in/create-listing.dto';
import { updateListingSchema } from '../dto/in/update-listing.dto';
import type { UpdateListingDto } from '../dto/in/update-listing.dto';
import { Listing } from '../entities/listing.entity';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createListingSchema))
  create(@Body() dto: CreateListingDto): Promise<Listing> {
    return this.listingService.create(dto);
  }

  @Get()
  findAll(): Promise<Listing[]> {
    return this.listingService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<Listing> {
    return this.listingService.findOne(uuid);
  }

  @Patch(':uuid')
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingDto,
  ): Promise<Listing> {
    return this.listingService.update(uuid, dto);
  }
}
