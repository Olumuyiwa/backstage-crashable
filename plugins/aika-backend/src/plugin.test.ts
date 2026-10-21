import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { aikaPlugin } from './plugin';
import request from 'supertest';

describe('plugin', () => {
  it('should return health status', async () => {
    const { server } = await startTestBackend({
      features: [
        aikaPlugin,
        mockServices.rootConfig.factory({
          data: {
            aika: {
              openaiApiKey: 'test-openai-api-key',
            },
          },
        }),
      ],
    });

    const response = await request(server).get('/api/aika/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      plugin: 'aika',
    });
  });

  it('should reject unauthenticated requests to ask', async () => {
    const { server } = await startTestBackend({
      features: [
        aikaPlugin,
        mockServices.rootConfig.factory({
          data: {
            aika: {
              openaiApiKey: 'test-openai-api-key',
            },
          },
        }),
      ],
    });

    const response = await request(server)
      .post('/api/aika/ask')
      .set('Authorization', mockCredentials.none.header())
      .send({ question: 'Hello AIKA' });

    expect(response.status).toBe(401);
  });
});
