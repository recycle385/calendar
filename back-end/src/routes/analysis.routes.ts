import { Router } from 'express';
import Joi from 'joi';

import { AnalysisController } from '../controllers/analysis.controller';
import { authenticateParticipant } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import {
  analysisHourlyRateLimiter,
  analysisMinuteRateLimiter,
  strictRateLimiter,
} from '../middlewares/rateLimiter';
import { slugParams, validateBody, validateParams } from '../middlewares/validation';

const analysisRequestSchema = Joi.object({
  question: Joi.string().trim().min(1).max(200).required(),
});

export const createAnalysisRouter = (controller: AnalysisController): Router => {
  const router = Router({ mergeParams: true });

  router.post(
    '/',
    validateParams(slugParams),
    authenticateParticipant,

    // IP 기준: 1분 10회
    strictRateLimiter,

    // 참가자 + 캘린더 기준: 1분 3회
    analysisMinuteRateLimiter,

    // 참가자 + 캘린더 기준: 1시간 15회
    analysisHourlyRateLimiter,

    validateBody(analysisRequestSchema),
    asyncHandler(controller.analyze)
  );

  return router;
};
