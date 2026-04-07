import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

interface CallOptions {
  system: string;
  userMessage: string;
  retries?: number;
  maxTokens?: number;
  tools?: Anthropic.Messages.Tool[];
  toolChoice?: Anthropic.Messages.MessageCreateParams['tool_choice'];
}

@Injectable()
export class AiModelService {
  private readonly logger = new Logger(AiModelService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  private async callRaw(
    options: CallOptions,
  ): Promise<Anthropic.Messages.Message> {
    const {
      system,
      userMessage,
      retries = 2,
      maxTokens = 4096,
      tools,
      toolChoice,
    } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.anthropic.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          system,
          messages: [
            { role: 'user', content: this.sanitizeInput(userMessage) },
          ],
          ...(tools && { tools }),
          ...(toolChoice && { tool_choice: toolChoice }),
        });
      } catch (error) {
        const isRetryable =
          error instanceof Anthropic.RateLimitError ||
          error instanceof Anthropic.InternalServerError ||
          error instanceof Anthropic.APIConnectionError;

        this.logger.error(
          `Anthropic call failed (attempt ${attempt + 1}/${retries + 1}): ${error}`,
        );

        if (!isRetryable || attempt === retries) {
          throw new ServiceUnavailableException(
            'AI service is temporarily unavailable. Please try again later.',
          );
        }

        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }

    throw new ServiceUnavailableException('AI service unavailable');
  }

  async callAnthropic(
    system: string,
    userMessage: string,
    retries = 1,
  ): Promise<string> {
    const response = await this.callRaw({ system, userMessage, retries });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    return textBlock.text;
  }

  async callAnthropicStructured<T>(
    system: string,
    userMessage: string,
    tool: Anthropic.Messages.Tool,
    schema: z.ZodType<T>,
    retries = 2,
  ): Promise<T> {
    const response = await this.callRaw({
      system,
      userMessage,
      retries,
      tools: [tool],
      toolChoice: { type: 'tool', name: tool.name },
    });

    const toolBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Anthropic response');
    }

    return schema.parse(toolBlock.input);
  }

  private sanitizeInput(input: string): string {
    const MAX_INPUT_LENGTH = 10_000;
    if (input.length > MAX_INPUT_LENGTH) {
      this.logger.warn(`Input truncated: ${input.length} chars`);
      input = input.substring(0, MAX_INPUT_LENGTH);
    }

    const patterns = [
      /ignore\s*(les|the|all|tout|previous|précédent)/gi,
      /oublie\s*(les|ton|ta|tes|tout)/gi,
      /forget\s*(your|the|all|previous)/gi,
      /tu\s+es\s+(maintenant|désormais|dorénavant)/gi,
      /you\s+are\s+now/gi,
      /system\s*prompt/gi,
      /new\s*(instructions?|role|persona)/gi,
      /<%|%>|\{\{|\}\}/g,
    ];

    let cleaned = input;
    let flagged = false;

    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        flagged = true;
        cleaned = cleaned.replace(pattern, '[REDACTED]');
      }
    }

    if (flagged) {
      this.logger.warn('Prompt injection patterns detected', {
        original: input.substring(0, 200),
      });
    }

    return cleaned;
  }
}
