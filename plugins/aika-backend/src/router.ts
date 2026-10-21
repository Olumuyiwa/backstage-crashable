import express from 'express';
import Router from 'express-promise-router';

import {
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';

import { AikaService } from './services/AikaService';

export interface RouterOptions {
  aikaService: AikaService;
  logger: LoggerService;
  httpAuth: HttpAuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const {
    aikaService,
    logger,
    httpAuth,
  } = options;

  const router = Router();

  router.use(express.json());

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      plugin: 'aika',
    });
  });

  router.post('/ask', async (req, res) => {
    await httpAuth.credentials(req);

    const question = req.body?.question;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'question is required',
      });

      return;
    }

    logger.info(`AIKA question received`);

    try {
      const answer = await aikaService.ask(question);

      res.json({
        question,
        answer,
      });
    } catch (error) {
      logger.error('AIKA request failed', {
        error,
      });

      res.status(500).json({
        error: 'AIKA failed to process the question',
      });
    }
  });

  return router;
}