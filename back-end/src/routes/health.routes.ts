import { Router } from 'express';

import pool from '../config/database';
import { redisClient } from '../config/redis';
import { HEALTH_ROUTES } from '../constants/routes.constants';

export const healthRouter = Router();

healthRouter.get(HEALTH_ROUTES.LIVE, (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get(HEALTH_ROUTES.READY, async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: redisClient.isReady ? 'ready' : 'degraded',
      database: 'up',
      redis: redisClient.isReady ? 'up' : 'degraded',
    });
  } catch {
    res.status(503).json({
      status: 'not_ready',
      database: 'down',
      redis: redisClient.isReady ? 'up' : 'degraded',
    });
  }
});
