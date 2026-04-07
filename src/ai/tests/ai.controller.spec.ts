import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../controllers/ai.controller';
import { AiService } from '../services/ai.service';
import { Platform } from '../enum/platform.enum';
import type { GeneratedAsset } from '../entities/generated-asset.entity';
import type { EnhanceResponseDto } from '../dto/out/enhance-response.dto';

const LISTING_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ASSET_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

type MockAiService = {
  enhanceListing: jest.Mock;
  generateAssets: jest.Mock;
  getAssetsByListing: jest.Mock;
  regenerateAsset: jest.Mock;
};

describe('AiController', () => {
  let controller: AiController;
  let aiService: MockAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            enhanceListing: jest.fn(),
            generateAssets: jest.fn(),
            getAssetsByListing: jest.fn(),
            regenerateAsset: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get(AiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('enhance', () => {
    it('should call aiService.enhanceListing and return the result', async () => {
      const expected: EnhanceResponseDto = {
        description: 'Bel appartement lumineux au cœur de Paris',
        suggestions: [
          'Ajouter des photos du balcon',
          'Préciser la proximité des transports',
        ],
      };
      aiService.enhanceListing.mockResolvedValue(expected);

      const result = await controller.enhance(LISTING_UUID);

      expect(aiService.enhanceListing).toHaveBeenCalledWith(LISTING_UUID);
      expect(result).toBe(expected);
    });
  });

  describe('generate', () => {
    it('should call aiService.generateAssets and return the assets', async () => {
      const dto = {
        platforms: [Platform.INSTAGRAM, Platform.FACEBOOK],
        tone: 'professionnel',
        lang: 'fr',
      };
      const expected = [
        {
          uuid: ASSET_UUID,
          platform: Platform.INSTAGRAM,
          content: 'Post Instagram',
          version: 1,
        },
        {
          uuid: ASSET_UUID,
          platform: Platform.FACEBOOK,
          content: 'Post Facebook',
          version: 1,
        },
      ] as GeneratedAsset[];
      aiService.generateAssets.mockResolvedValue(expected);

      const result = await controller.generate(LISTING_UUID, dto);

      expect(aiService.generateAssets).toHaveBeenCalledWith(LISTING_UUID, dto);
      expect(result).toBe(expected);
    });
  });

  describe('getAssets', () => {
    it('should call aiService.getAssetsByListing and return the assets', async () => {
      const expected = [
        {
          uuid: ASSET_UUID,
          platform: Platform.PORTAL,
          content: 'Annonce portail',
          version: 1,
        },
      ] as GeneratedAsset[];
      aiService.getAssetsByListing.mockResolvedValue(expected);

      const result = await controller.getAssets(LISTING_UUID);

      expect(aiService.getAssetsByListing).toHaveBeenCalledWith(LISTING_UUID);
      expect(result).toBe(expected);
    });
  });

  describe('regenerate', () => {
    it('should call aiService.regenerateAsset and return the new asset', async () => {
      const dto = { tone: 'décontracté', lang: 'fr' };
      const expected = {
        uuid: ASSET_UUID,
        platform: Platform.FACEBOOK,
        content: 'Nouveau contenu régénéré',
        version: 2,
      } as GeneratedAsset;
      aiService.regenerateAsset.mockResolvedValue(expected);

      const result = await controller.regenerate(ASSET_UUID, dto);

      expect(aiService.regenerateAsset).toHaveBeenCalledWith(ASSET_UUID, dto);
      expect(result).toBe(expected);
    });
  });
});
