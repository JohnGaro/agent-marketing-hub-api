import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AiService } from '../services/ai.service';
import { GeneratedAsset } from '../entities/generated-asset.entity';
import { PromptTemplate } from '../entities/prompt-template.entity';
import { ListingService } from '../../listing/services/listing.service';
import { Platform } from '../enum/platform.enum';
import { PromptType } from '../enum/prompt-type.enum';
import { PropertyType } from '../../listing/enums/property-type.enum';
import { ListingStatus } from '../../listing/enums/listing-status.enum';
import { ListingCreatedEvent } from '../../listing/events/listing-created.event';
import { Listing } from 'src/listing/entities/listing.entity';

jest.mock('@anthropic-ai/sdk');

/** Shape of the first argument passed to `anthropic.messages.create` (tests only need messages[0].content). */
type MessagesCreateParams = {
  messages: Array<{ content: string }>;
};

type MessagesCreateCallArgs = [MessagesCreateParams];

const LISTING_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ASSET_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockListing = {
  uuid: LISTING_UUID,
  propertyType: PropertyType.APARTMENT,
  address: '10 Rue de la Paix, Paris',
  neighborhood: 'Opéra',
  price: 500000,
  surface: 80,
  rooms: 4,
  bedrooms: 2,
  bathrooms: 1,
  floor: '3',
  orientation: null,
  hasElevator: true,
  hasBalcony: true,
  balconySurface: 10,
  hasGarden: false,
  gardenSurface: null,
  energyClass: 'B',
  condition: 'bon',
  heatingType: 'central',
  description: 'Belle description existante',
  improvements: null,
  notes: "Notes de l'agent",
  status: ListingStatus.DRAFT,
  photos: [],
};

const makeTextResponse = (text: string) => ({
  content: [{ type: 'text', text }],
});

const makeToolResponse = (input: object) => ({
  content: [{ type: 'tool_use', name: 'enhance_output', input }],
});

describe('AiService', () => {
  let service: AiService;
  let mockMessagesCreate: jest.Mock<Promise<unknown>, MessagesCreateCallArgs>;
  let listingService: jest.Mocked<Pick<ListingService, 'findOne' | 'update'>>;
  let assetRepository: jest.Mocked<{
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  }>;
  let templateRepository: jest.Mocked<{
    find: jest.Mock;
    findOne: jest.Mock;
  }>;

  beforeEach(async () => {
    mockMessagesCreate = jest.fn<Promise<unknown>, MessagesCreateCallArgs>();
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockMessagesCreate },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'ANTHROPIC_API_KEY') return 'test-key';
              return fallback;
            }),
          },
        },
        {
          provide: ListingService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GeneratedAsset),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PromptTemplate),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    listingService = module.get(ListingService);
    assetRepository = module.get(getRepositoryToken(GeneratedAsset));
    templateRepository = module.get(getRepositoryToken(PromptTemplate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enhanceListing', () => {
    it('should enhance a listing and return description + suggestions', async () => {
      const enhanceResult = {
        description: 'Description enrichie et professionnelle',
        suggestions: [
          'Ajouter des photos du balcon',
          'Préciser la proximité des transports',
        ],
      };

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.findOne.mockResolvedValue(null);
      mockMessagesCreate.mockResolvedValue(makeToolResponse(enhanceResult));
      listingService.update.mockResolvedValue(
        mockListing as unknown as Listing,
      );

      const result = await service.enhanceListing(LISTING_UUID);

      expect(listingService.findOne).toHaveBeenCalledWith(LISTING_UUID);
      expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
      expect(listingService.update).toHaveBeenCalledWith(LISTING_UUID, {
        description: enhanceResult.description,
        improvements: enhanceResult.suggestions.join('\n'),
        status: ListingStatus.ENHANCED,
      });
      expect(result).toEqual(enhanceResult);
    });

    it('should use the DB template when available', async () => {
      const dbTemplateContent =
        'Template personnalisé depuis la base de données';
      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.findOne.mockResolvedValue({
        type: PromptType.ENHANCE,
        template: dbTemplateContent,
      } as PromptTemplate);
      mockMessagesCreate.mockResolvedValue(
        makeToolResponse({ description: 'desc', suggestions: [] }),
      );
      listingService.update.mockResolvedValue(
        mockListing as unknown as Listing,
      );

      await service.enhanceListing(LISTING_UUID);

      const userMessage =
        mockMessagesCreate.mock.calls[0][0].messages[0].content;
      expect(userMessage).toContain(dbTemplateContent);
    });

    it('should throw ServiceUnavailableException when anthropic fails all retries', async () => {
      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.findOne.mockResolvedValue(null);
      mockMessagesCreate.mockRejectedValue(new Error('Network error'));

      await expect(service.enhanceListing(LISTING_UUID)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('generateAssets', () => {
    it('should generate and save assets for each platform', async () => {
      const dto = { platforms: [Platform.INSTAGRAM, Platform.PORTAL] };
      const generatedContent = 'Contenu marketing généré';
      const savedAsset = {
        uuid: ASSET_UUID,
        platform: Platform.INSTAGRAM,
        content: generatedContent,
        version: 1,
      } as GeneratedAsset;

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.find.mockResolvedValue([]);
      mockMessagesCreate.mockResolvedValue(makeTextResponse(generatedContent));
      assetRepository.create.mockReturnValue(savedAsset);
      assetRepository.save.mockResolvedValue(savedAsset);

      const result = await service.generateAssets(LISTING_UUID, dto);

      expect(listingService.findOne).toHaveBeenCalledWith(LISTING_UUID);
      expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
      expect(assetRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should include tone and lang in the Anthropic message when provided', async () => {
      const dto = {
        platforms: [Platform.INSTAGRAM],
        tone: 'professionnel',
        lang: 'fr',
      };
      const savedAsset = {
        uuid: ASSET_UUID,
        platform: Platform.INSTAGRAM,
        content: 'content',
        version: 1,
      } as GeneratedAsset;

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.find.mockResolvedValue([]);
      mockMessagesCreate.mockResolvedValue(makeTextResponse('content'));
      assetRepository.create.mockReturnValue(savedAsset);
      assetRepository.save.mockResolvedValue(savedAsset);

      await service.generateAssets(LISTING_UUID, dto);

      const userMessage =
        mockMessagesCreate.mock.calls[0][0].messages[0].content;
      expect(userMessage).toContain('professionnel');
      expect(userMessage).toContain('fr');
    });

    it('should use DB template for a platform when available', async () => {
      const dto = { platforms: [Platform.PORTAL] };
      const dbTemplate = {
        type: PromptType.PORTAL,
        template: 'Template portail custom',
      } as PromptTemplate;
      const savedAsset = {
        uuid: ASSET_UUID,
        platform: Platform.PORTAL,
        content: 'content',
        version: 1,
      } as GeneratedAsset;

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.find.mockResolvedValue([dbTemplate]);
      mockMessagesCreate.mockResolvedValue(makeTextResponse('content'));
      assetRepository.create.mockReturnValue(savedAsset);
      assetRepository.save.mockResolvedValue(savedAsset);

      await service.generateAssets(LISTING_UUID, dto);

      const userMessage =
        mockMessagesCreate.mock.calls[0][0].messages[0].content;
      expect(userMessage).toContain('Template portail custom');
    });

    it('should return only successful assets when some platforms fail', async () => {
      const dto = { platforms: [Platform.INSTAGRAM, Platform.PORTAL] };
      const savedAsset = {
        uuid: ASSET_UUID,
        platform: Platform.INSTAGRAM,
        content: 'content',
        version: 1,
      } as GeneratedAsset;

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.find.mockResolvedValue([]);
      mockMessagesCreate
        .mockResolvedValueOnce(makeTextResponse('content'))
        .mockRejectedValue(new Error('API error'));
      assetRepository.create.mockReturnValue(savedAsset);
      assetRepository.save.mockResolvedValue(savedAsset);

      const result = await service.generateAssets(LISTING_UUID, dto);

      expect(result).toHaveLength(1);
    });

    it('should throw ServiceUnavailableException when all platforms fail', async () => {
      const dto = { platforms: [Platform.INSTAGRAM] };
      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      templateRepository.find.mockResolvedValue([]);
      mockMessagesCreate.mockRejectedValue(new Error('API error'));

      await expect(service.generateAssets(LISTING_UUID, dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('regenerateAsset', () => {
    const existingAsset = {
      uuid: ASSET_UUID,
      platform: Platform.FACEBOOK,
      content: 'Ancien contenu Facebook',
      tone: 'casual',
      lang: 'fr',
      version: 2,
      listing: mockListing,
    } as unknown as GeneratedAsset;

    it('should create a new asset with an incremented version', async () => {
      const dto = { tone: 'professionnel', lang: 'en' };
      const newAsset = {
        ...existingAsset,
        version: 3,
        content: 'Nouveau contenu',
      } as unknown as GeneratedAsset;

      assetRepository.findOne.mockResolvedValue(existingAsset);
      templateRepository.findOne.mockResolvedValue(null);
      mockMessagesCreate.mockResolvedValue(makeTextResponse('Nouveau contenu'));
      assetRepository.create.mockReturnValue(newAsset);
      assetRepository.save.mockResolvedValue(newAsset);

      const result = await service.regenerateAsset(ASSET_UUID, dto);

      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: ASSET_UUID },
        relations: ['listing', 'listing.photos'],
      });
      expect(assetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: Platform.FACEBOOK,
          version: 3,
          tone: dto.tone,
          lang: dto.lang,
        }),
      );
      expect(result).toBe(newAsset);
    });

    it('should include the previous content in the Anthropic message', async () => {
      const dto = {};
      const newAsset = {
        ...existingAsset,
        version: 3,
      } as unknown as GeneratedAsset;

      assetRepository.findOne.mockResolvedValue(existingAsset);
      templateRepository.findOne.mockResolvedValue(null);
      mockMessagesCreate.mockResolvedValue(makeTextResponse('content'));
      assetRepository.create.mockReturnValue(newAsset);
      assetRepository.save.mockResolvedValue(newAsset);

      await service.regenerateAsset(ASSET_UUID, dto);

      const userMessage =
        mockMessagesCreate.mock.calls[0][0].messages[0].content;
      expect(userMessage).toContain(existingAsset.content);
    });

    it('should throw NotFoundException when asset does not exist', async () => {
      assetRepository.findOne.mockResolvedValue(null);

      await expect(service.regenerateAsset(ASSET_UUID, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAssetsByListing', () => {
    it('should verify listing existence and return sorted assets', async () => {
      const assets = [
        {
          uuid: ASSET_UUID,
          platform: Platform.PORTAL,
          content: 'content',
          version: 1,
        },
      ] as GeneratedAsset[];

      listingService.findOne.mockResolvedValue(
        mockListing as unknown as Listing,
      );
      assetRepository.find.mockResolvedValue(assets);

      const result = await service.getAssetsByListing(LISTING_UUID);

      expect(listingService.findOne).toHaveBeenCalledWith(LISTING_UUID);
      expect(assetRepository.find).toHaveBeenCalledWith({
        where: { listing: { uuid: LISTING_UUID } },
        order: { platform: 'ASC', version: 'DESC' },
      });
      expect(result).toBe(assets);
    });

    it('should propagate NotFoundException when listing does not exist', async () => {
      listingService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.getAssetsByListing(LISTING_UUID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handleListingCreated', () => {
    it('should call enhanceListing when a listing is created', async () => {
      const event = new ListingCreatedEvent(LISTING_UUID);
      const enhanceSpy = jest
        .spyOn(service, 'enhanceListing')
        .mockResolvedValue({ description: 'desc', suggestions: [] });

      await service.handleListingCreated(event);

      expect(enhanceSpy).toHaveBeenCalledWith(LISTING_UUID);
    });

    it('should not throw when enhanceListing fails', async () => {
      const event = new ListingCreatedEvent(LISTING_UUID);
      jest
        .spyOn(service, 'enhanceListing')
        .mockRejectedValue(new Error('AI unavailable'));

      await expect(service.handleListingCreated(event)).resolves.not.toThrow();
    });
  });
});
