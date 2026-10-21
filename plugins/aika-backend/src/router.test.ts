import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import { AuthenticationError } from '@backstage/errors';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { AikaService } from './services/AikaService';

describe('createRouter', () => {
  let app: express.Express;
  let aikaService: jest.Mocked<AikaService>;

  beforeEach(async () => {
    aikaService = {
      ask: jest.fn(),
    } as unknown as jest.Mocked<AikaService>;

    const router = await createRouter({
      aikaService,
      logger: mockServices.logger.mock(),
      httpAuth: mockServices.httpAuth(),
    });

    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        plugin: 'aika',
      });
    });
  });

  describe('POST /ask', () => {
    it('should successfully return an answer for a valid question', async () => {
      aikaService.ask.mockResolvedValue('This is the AIKA answer');

      const response = await request(app)
        .post('/ask')
        .send({ question: 'Hello AIKA' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        question: 'Hello AIKA',
        answer: 'This is the AIKA answer',
      });
      expect(aikaService.ask).toHaveBeenCalledWith('Hello AIKA');
    });

    it('should return 400 if the question is missing', async () => {
      const response = await request(app).post('/ask').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'question is required',
      });
    });

    it('should return 400 if the question is not a string', async () => {
      const response = await request(app)
        .post('/ask')
        .send({ question: 12345 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'question is required',
      });
    });

    it('should not allow unauthenticated requests', async () => {
      const unauthRouter = await createRouter({
        aikaService,
        logger: mockServices.logger.mock(),
        httpAuth: {
          credentials: jest
            .fn()
            .mockRejectedValue(new AuthenticationError('Unauthenticated')),
        } as any,
      });

      const unauthApp = express();
      unauthApp.use(unauthRouter);
      unauthApp.use(mockErrorHandler());

      const response = await request(unauthApp)
        .post('/ask')
        .send({ question: 'Hello AIKA' });

      expect(response.status).toBe(401);
    });

    it('should return 500 if the aikaService fails', async () => {
      aikaService.ask.mockRejectedValue(new Error('Service failure'));

      const response = await request(app)
        .post('/ask')
        .send({ question: 'Hello AIKA' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'AIKA failed to process the question',
      });
    });
  });
});
