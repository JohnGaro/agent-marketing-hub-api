import { Test, TestingModule } from '@nestjs/testing';
import { ListingController } from '../controllers/listing.controller';
import { ListingService } from '../services/listing.service';
import { PropertyType } from '../enums/property-type.enum';
import { ListingStatus } from '../enums/listing-status.enum';
import type { CreateListingDto } from '../dto/in/create-listing.dto';
import type { UpdateListingDto } from '../dto/in/update-listing.dto';
import type { Listing } from '../entities/listing.entity';

const LISTING_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function listingStub(overrides: Partial<Listing> = {}): Listing {
  const now = new Date();
  return {
    uuid: LISTING_UUID,
    photos: [] as Listing['photos'],
    generatedAssets: [] as Listing['generatedAssets'],
    propertyType: PropertyType.APARTMENT,
    address: '',
    neighborhood: null,
    price: 0,
    surface: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    floor: null,
    orientation: null,
    hasElevator: false,
    hasBalcony: false,
    balconySurface: null,
    hasGarden: false,
    gardenSurface: null,
    energyClass: null,
    condition: null,
    heatingType: null,
    description: null,
    improvements: null,
    notes: null,
    status: ListingStatus.DRAFT,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

type MockListingService = {
  create: jest.Mock;
  findAll: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
};

describe('ListingController', () => {
  let controller: ListingController;
  let listingService: MockListingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingController],
      providers: [
        {
          provide: ListingService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ListingController>(ListingController);
    listingService = module.get(ListingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call listingService.create and return the listing', async () => {
      const dto: CreateListingDto = {
        propertyType: PropertyType.APARTMENT,
        address: '10 rue de la Paix',
        price: 450_000,
        surface: 65,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
      };
      const expected = listingStub({
        uuid: LISTING_UUID,
        ...(dto as Omit<CreateListingDto, 'photos'>),
        status: ListingStatus.PUBLISHED,
      });
      listingService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(listingService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('findAll', () => {
    it('should call listingService.findAll and return the listings', async () => {
      const expected = [
        listingStub({ uuid: LISTING_UUID, address: '10 rue de la Paix' }),
      ];
      listingService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(listingService.findAll).toHaveBeenCalledWith();
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should call listingService.findOne with uuid and return the listing', async () => {
      const expected = listingStub({
        uuid: LISTING_UUID,
        address: '10 rue de la Paix',
      });
      listingService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(LISTING_UUID);

      expect(listingService.findOne).toHaveBeenCalledWith(LISTING_UUID);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should call listingService.update and return the listing', async () => {
      const dto: UpdateListingDto = { notes: 'Mise à jour agent' };
      const expected = listingStub({
        uuid: LISTING_UUID,
        notes: 'Mise à jour agent',
      });
      listingService.update.mockResolvedValue(expected);

      const result = await controller.update(LISTING_UUID, dto);

      expect(listingService.update).toHaveBeenCalledWith(LISTING_UUID, dto);
      expect(result).toBe(expected);
    });
  });
});
