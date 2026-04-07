import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  generateAssetsSchema,
  type GenerateAssetsDto,
} from '../dto/in/generate-assets.dto';
import {
  regenerateAssetSchema,
  type RegenerateAssetDto,
} from '../dto/in/regenerate-asset.dto';
import type { EnhanceResponseDto } from '../dto/out/enhance-response.dto';
import type { GeneratedAsset } from '../entities/generated-asset.entity';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('listings/:uuid/enhance')
  enhance(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<EnhanceResponseDto> {
    return this.aiService.enhanceListing(uuid);
  }

  @Post('listings/:uuid/generate')
  generate(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(new ZodValidationPipe(generateAssetsSchema)) dto: GenerateAssetsDto,
  ): Promise<GeneratedAsset[]> {
    return this.aiService.generateAssets(uuid, dto);
  }

  @Get('listings/:uuid/assets')
  getAssets(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<GeneratedAsset[]> {
    return this.aiService.getAssetsByListing(uuid);
  }

  @Post('assets/:uuid/regenerate')
  regenerate(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(new ZodValidationPipe(regenerateAssetSchema))
    dto: RegenerateAssetDto,
  ): Promise<GeneratedAsset> {
    return this.aiService.regenerateAsset(uuid, dto);
  }
}
