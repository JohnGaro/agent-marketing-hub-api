import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplate } from './entities/prompt-template.entity';
import { GeneratedAsset } from './entities/generated-asset.entity';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { ListingModule } from '../listing/listing.module';
import { AiModelService } from './services/ai-model.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromptTemplate, GeneratedAsset]),
    ListingModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiModelService],
  exports: [AiService],
})
export class AiModule {}
