import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { PromptTemplate } from '../../ai/entities/prompt-template.entity';
import { PromptType } from '../../ai/enum/prompt-type.enum';
import {
  ENHANCE_FALLBACK_PROMPT,
  PLATFORM_FALLBACK_PROMPTS,
} from '../../ai/prompts';
import { Platform } from '../../ai/enum/platform.enum';

const templates: { type: PromptType; template: string }[] = [
  { type: PromptType.ENHANCE, template: ENHANCE_FALLBACK_PROMPT },
  {
    type: PromptType.PORTAL,
    template: PLATFORM_FALLBACK_PROMPTS[Platform.PORTAL],
  },
  {
    type: PromptType.INSTAGRAM,
    template: PLATFORM_FALLBACK_PROMPTS[Platform.INSTAGRAM],
  },
  {
    type: PromptType.FACEBOOK,
    template: PLATFORM_FALLBACK_PROMPTS[Platform.FACEBOOK],
  },
  {
    type: PromptType.WHATSAPP,
    template: PLATFORM_FALLBACK_PROMPTS[Platform.WHATSAPP],
  },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(PromptTemplate);

  for (const template of templates) {
    const existing = await repo.findOne({ where: { type: template.type } });
    if (existing) {
      existing.template = template.template;
      await repo.save(existing);
      console.log(`Updated template: ${template.type}`);
    } else {
      await repo.save(repo.create(template));
      console.log(`Created template: ${template.type}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
