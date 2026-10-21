import OpenAI from 'openai';
import { CatalogApi } from '@backstage/catalog-client';

type Logger = {
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
};

type AikaServiceOptions = {
  apiKey: string;
  model: string;
  catalogApi: CatalogApi;
  logger: Logger;
};

export class AikaService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly catalogApi: CatalogApi;
  private readonly logger: Logger;

  constructor(options: AikaServiceOptions) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
    });

    this.model = options.model;
    this.catalogApi = options.catalogApi;
    this.logger = options.logger;
  }

  async ask(question: string): Promise<string> {
    this.logger.info('AIKA received question', {
      question,
    });

    const tools: OpenAI.Responses.Tool[] = [
      {
        type: 'function',
        name: 'find_catalog_entity',
        description:
          'Find a Backstage Software Catalog entity by its name. Use this when the user asks about a service, component, system, API, owner, lifecycle, or entity.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'The name of the Backstage catalog entity, for example payment-service',
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
        strict: true,
      },
    ];

    let response = await this.openai.responses.create({
      model: this.model,

      instructions: `
You are AIKA, the internal engineering assistant inside Backstage.

Your role is to help developers understand their engineering platform.

Rules:

1. Backstage Software Catalog is the source of truth for services.
2. Never invent service ownership.
3. Never invent lifecycle information.
4. When a developer asks about a Backstage service or component,
   use the catalog tool.
5. If the catalog has no information, say so clearly.
6. Keep answers concise and engineering-focused.
7. Explain technical concepts in simple language where useful.
`,

      input: question,

      tools,
    });

    while (true) {
      const functionCalls = response.output.filter(
        item => item.type === 'function_call',
      );

      if (functionCalls.length === 0) {
        return response.output_text;
      }

      const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];

      for (const call of functionCalls) {
        if (call.name !== 'find_catalog_entity') {
          continue;
        }

        const args = JSON.parse(call.arguments) as {
          name: string;
        };

        const result = await this.findCatalogEntity(args.name);

        toolOutputs.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }

      response = await this.openai.responses.create({
        model: this.model,

        previous_response_id: response.id,

        input: toolOutputs,

        tools,
      });
    }
  }

  private async findCatalogEntity(name: string) {
    this.logger.info('Searching Backstage Catalog', {
      name,
    });

    const result = await this.catalogApi.getEntities({
      filter: {
        'metadata.name': name,
      },
    });

    if (!result.items.length) {
      return {
        found: false,
        message: `No Backstage entity named "${name}" was found.`,
      };
    }

    return {
      found: true,
      entities: result.items.map(entity => ({
        kind: entity.kind,
        name: entity.metadata.name,
        namespace: entity.metadata.namespace ?? 'default',
        title: entity.metadata.title,
        description: entity.metadata.description,
        owner: entity.spec?.owner,
        lifecycle: entity.spec?.lifecycle,
        type: entity.spec?.type,
        system: entity.spec?.system,
        tags: entity.metadata.tags ?? [],
      })),
    };
  }
}