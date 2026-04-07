import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GeneratedAsset } from '../entities/generated-asset.entity';
import { PromptTemplate } from '../entities/prompt-template.entity';
import { Platform } from '../enum/platform.enum';
import { PromptType } from '../enum/prompt-type.enum';
import { ListingService } from '../../listing/services/listing.service';
import { Listing } from '../../listing/entities/listing.entity';
import { ListingStatus } from '../../listing/enums/listing-status.enum';
import type { GenerateAssetsDto } from '../dto/in/generate-assets.dto';
import type { RegenerateAssetDto } from '../dto/in/regenerate-asset.dto';
import type { EnhanceResponseDto } from '../dto/out/enhance-response.dto';
import {
  SYSTEM_PROMPT,
  ENHANCE_FALLBACK_PROMPT,
  PLATFORM_FALLBACK_PROMPTS,
} from '../prompts';
import { ListingCreatedEvent } from '../../listing/events/listing-created.event';

const enhanceOutputSchema = z.object({
  description: z.string(),
  suggestions: z.array(z.string()),
});

enum AiModel {
  STANDARD = 'claude-haiku-4-5-20251001',
  REASONING = 'claude-sonnet-4-5-20250929',
  ULTRA = 'claude-opus-4-6',
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly listingService: ListingService,
    @InjectRepository(GeneratedAsset)
    private readonly assetRepository: Repository<GeneratedAsset>,
    @InjectRepository(PromptTemplate)
    private readonly templateRepository: Repository<PromptTemplate>,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
    this.model = this.configService.get<AiModel>(
      'ANTHROPIC_MODEL',
      AiModel.REASONING,
    );
  }

  async enhanceListing(listingUuid: string): Promise<EnhanceResponseDto> {
    const listing = await this.listingService.findOne(listingUuid);
    const context = this.buildListingContext(listing);
    const template = await this.getTemplate(PromptType.ENHANCE);

    const userMessage = `${template}\n\n---\n\nDonnées du bien :\n${context}`;

    const parsed = await this.callAnthropicStructured<EnhanceResponseDto>(
      SYSTEM_PROMPT,
      userMessage,
      {
        name: 'enhance_output',
        description:
          'Structured output containing the enhanced description and improvement suggestions',
        input_schema: {
          type: 'object' as const,
          properties: {
            description: {
              type: 'string',
              description:
                'Professional real-estate listing description (150-300 words)',
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Missing information suggestions for potential buyers',
            },
          },
          required: ['description', 'suggestions'],
        },
      },
      enhanceOutputSchema,
    );

    listing.description = parsed.description;
    listing.improvements = parsed.suggestions.join('\n');
    listing.status = ListingStatus.ENHANCED;
    await this.listingService.update(listingUuid, {
      description: parsed.description,
      improvements: parsed.suggestions.join('\n'),
      status: ListingStatus.ENHANCED,
    });

    return parsed;
  }

  @OnEvent('listing.created', { async: true })
  async handleListingCreated(event: ListingCreatedEvent): Promise<void> {
    try {
      await this.enhanceListing(event.listingUuid);
    } catch (error) {
      this.logger.error(
        `Auto-enhance failed for listing ${event.listingUuid}: ${error}`,
      );
    }
  }

  async generateAssets(
    listingUuid: string,
    dto: GenerateAssetsDto,
  ): Promise<GeneratedAsset[]> {
    const listing = await this.listingService.findOne(listingUuid);
    const context = this.buildListingContext(listing);

    const templates = await this.templateRepository.find({
      where: {
        type: In(dto.platforms.map((p) => p as unknown as PromptType)),
      },
    });
    const templateMap = new Map(templates.map((t) => [t.type, t.template]));

    const results = await Promise.allSettled(
      dto.platforms.map(async (platform) => {
        const templateContent =
          templateMap.get(platform as unknown as PromptType) ??
          PLATFORM_FALLBACK_PROMPTS[platform];

        let userMessage = `${templateContent}\n\n---\n\nDonnées du bien :\n${context}`;
        if (listing.description) {
          userMessage += `\n\nDescription enrichie du bien :\n${listing.description}`;
        }
        if (dto.tone) {
          userMessage += `\n\nTon demandé : ${dto.tone}`;
        }
        if (dto.lang) {
          userMessage += `\n\nLangue de rédaction : ${dto.lang}`;
        }

        const content = await this.callAnthropic(SYSTEM_PROMPT, userMessage);

        const asset = this.assetRepository.create({
          platform,
          tone: dto.tone,
          lang: dto.lang,
          content,
          version: 1,
          listing: { uuid: listingUuid } as Listing,
        });
        return this.assetRepository.save(asset);
      }),
    );

    const assets: GeneratedAsset[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        assets.push(result.value);
      } else {
        this.logger.error(`Asset generation failed: ${result.reason}`);
      }
    }

    if (assets.length === 0) {
      throw new ServiceUnavailableException(
        'All platform generations failed. Please try again.',
      );
    }

    return assets;
  }

  async regenerateAsset(
    assetUuid: string,
    dto: RegenerateAssetDto,
  ): Promise<GeneratedAsset> {
    const existing = await this.assetRepository.findOne({
      where: { uuid: assetUuid },
      relations: ['listing', 'listing.photos'],
    });

    if (!existing) {
      throw new NotFoundException(`Asset ${assetUuid} not found`);
    }

    const listing = existing.listing;
    const context = this.buildListingContext(listing);
    const template = await this.getTemplate(
      existing.platform as unknown as PromptType,
    );

    let userMessage = `${template}\n\n---\n\nDonnées du bien :\n${context}`;
    if (listing.description) {
      userMessage += `\n\nDescription enrichie du bien :\n${listing.description}`;
    }
    userMessage += `\n\n---\n\nContenu précédent (à améliorer) :\n${existing.content}`;

    if (existing.tone) {
      userMessage += `\n\nTon souhaité : ${dto.tone}`;
    }
    if (existing.lang) {
      userMessage += `\n\nLangue de rédaction : ${dto.lang}`;
    }

    const content = await this.callAnthropic(SYSTEM_PROMPT, userMessage);

    const newAsset = this.assetRepository.create({
      platform: existing.platform,
      content,
      tone: dto.tone,
      lang: dto.lang,
      version: existing.version + 1,
      listing: { uuid: listing.uuid } as Listing,
    });

    return this.assetRepository.save(newAsset);
  }

  async getAssetsByListing(listingUuid: string): Promise<GeneratedAsset[]> {
    await this.listingService.findOne(listingUuid);

    return this.assetRepository.find({
      where: { listing: { uuid: listingUuid } },
      order: { platform: 'ASC', version: 'DESC' },
    });
  }

  private async getTemplate(type: PromptType): Promise<string> {
    const template = await this.templateRepository.findOne({
      where: { type },
    });

    if (template) return template.template;

    if (type === PromptType.ENHANCE) return ENHANCE_FALLBACK_PROMPT;
    return PLATFORM_FALLBACK_PROMPTS[type as unknown as Platform] ?? '';
  }

  private buildListingContext(listing: Listing): string {
    const lines: string[] = [];

    lines.push(`Type de bien : ${listing.propertyType}`);
    lines.push(`Adresse : ${listing.address}`);
    if (listing.neighborhood) lines.push(`Quartier : ${listing.neighborhood}`);
    lines.push(`Prix : ${Number(listing.price).toLocaleString('fr-FR')} €`);
    lines.push(`Surface : ${listing.surface} m²`);
    lines.push(`Pièces : ${listing.rooms}`);
    lines.push(`Chambres : ${listing.bedrooms}`);
    lines.push(`Salles de bain : ${listing.bathrooms}`);

    if (listing.floor) lines.push(`Étage : ${listing.floor}`);
    if (listing.orientation) lines.push(`Orientation : ${listing.orientation}`);
    if (listing.hasElevator)
      lines.push(`Ascenseur : ${listing.hasElevator ? 'oui' : 'non'}`);
    if (listing.hasBalcony) {
      const detail = listing.balconySurface
        ? ` (${listing.balconySurface} m²)`
        : '';
      lines.push(`Balcon : oui${detail}`);
    }
    if (listing.hasGarden) {
      const detail = listing.gardenSurface
        ? ` (${listing.gardenSurface} m²)`
        : '';
      lines.push(`Jardin : oui${detail}`);
    }
    if (listing.energyClass)
      lines.push(`Classe énergie (DPE) : ${listing.energyClass}`);
    if (listing.condition) lines.push(`État : ${listing.condition}`);
    if (listing.heatingType) lines.push(`Chauffage : ${listing.heatingType}`);
    if (listing.notes) lines.push(`Notes de l'agent : ${listing.notes}`);

    if (listing.photos?.length) {
      lines.push(`\nPhotos (${listing.photos.length}) :`);
      for (const photo of listing.photos) {
        const caption = photo.caption ? ` — ${photo.caption}` : '';
        lines.push(`  - ${photo.url}${caption}`);
      }
    }

    return lines.join('\n');
  }

  private async callAnthropic(
    system: string,
    userMessage: string,
    retries = 1,
  ): Promise<string> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system,
          messages: [{ role: 'user', content: userMessage }],
        });

        const textBlock = response.content.find(
          (block) => block.type === 'text',
        );
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text content in Anthropic response');
        }

        return textBlock.text;
      } catch (error) {
        this.logger.error(
          `Anthropic call failed (attempt ${attempt + 1}/${retries + 1}): ${error}`,
        );
        if (attempt === retries) {
          throw new ServiceUnavailableException(
            'AI service is temporarily unavailable. Please try again later.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('AI service unavailable');
  }

  private async callAnthropicStructured<T>(
    system: string,
    userMessage: string,
    tool: Anthropic.Messages.Tool,
    schema: z.ZodType<T>,
    retries = 2,
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4000,
          system,
          messages: [{ role: 'user', content: userMessage }],
          tools: [tool],
          tool_choice: { type: 'tool', name: tool.name },
        });

        const toolBlock = response.content.find(
          (block) => block.type === 'tool_use',
        );
        if (!toolBlock || toolBlock.type !== 'tool_use') {
          throw new Error('No tool_use block in Anthropic response');
        }

        return schema.parse(toolBlock.input);
      } catch (error) {
        this.logger.error(
          `Anthropic structured call failed (attempt ${attempt + 1}/${retries + 1}): ${error}`,
        );
        if (attempt === retries) {
          throw new ServiceUnavailableException(
            'AI service is temporarily unavailable. Please try again later.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('AI service unavailable');
  }
}
