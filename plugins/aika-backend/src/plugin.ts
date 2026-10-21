import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

import { CatalogClient } from '@backstage/catalog-client';

import { createRouter } from './router';
import { AikaService } from './services/AikaService';

export const aikaPlugin = createBackendPlugin({
  pluginId: 'aika',

  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },

      async init({
        config,
        logger,
        discovery,
        auth,
        httpAuth,
        httpRouter,
      }) {
        const apiKey = config.getString('aika.openaiApiKey');

        const model =
          config.getOptionalString('aika.model') ??
          'gpt-5';

        const catalogApi = new CatalogClient({
          discoveryApi: discovery,
        });

        const aikaService = new AikaService({
          apiKey,
          model,
          catalogApi,
          logger,
        });

        httpRouter.use(
          await createRouter({
            aikaService,
            logger,
            httpAuth,
          }),
        );

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});