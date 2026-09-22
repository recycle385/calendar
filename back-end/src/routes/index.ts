import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from '../config/env';
import { swaggerSets } from '../config/swagger';
import {
  ANALYSIS_ROUTES,
  AUTH_ROUTES,
  CALENDAR_ROUTES,
  DATE_INFO_ROUTES,
  HEALTH_ROUTES,
  PARTICIPANT_ROUTES,
  SWAGGER_ROUTES,
  VOTE_ROUTES,
} from '../constants/routes.constants';
import { analysisController } from '../containers/analysis.container';
import { authController } from '../containers/auth.container';
import { calendarController } from '../containers/calendar.container';
import { dateInfoController } from '../containers/dateInfo.container';
import { participantController } from '../containers/participant.container';
import { voteController } from '../containers/vote.container';
import { createAnalysisRouter } from './analysis.routes';
import { createAuthRouter } from './auth.routes';
import { createCalendarRouter } from './calendar.routes';
import { createDateInfoRouter } from './dateInfo.routes';
import { healthRouter } from './health.routes';
import { createParticipantRouter } from './participant.routes';
import { createVoteRouter } from './vote.routes';

const router = Router();
const authRouter = createAuthRouter(authController);
const calendarRouter = createCalendarRouter(calendarController);
const dateInfoRouter = createDateInfoRouter(dateInfoController);
const participantRouter = createParticipantRouter(participantController);
const voteRouter = createVoteRouter(voteController);
const swaggerRouter = swaggerUi.setup(swaggerSets);
const analysisRouter = createAnalysisRouter(analysisController);

router.use(AUTH_ROUTES.BASE, authRouter);
router.use(CALENDAR_ROUTES.BASE, calendarRouter);
router.use(DATE_INFO_ROUTES.BASE, dateInfoRouter);
router.use(HEALTH_ROUTES.BASE, healthRouter);
router.use(PARTICIPANT_ROUTES.BASE, participantRouter);
router.use(VOTE_ROUTES.BASE, voteRouter);
if (env.NODE_ENV !== 'production') {
  router.use(SWAGGER_ROUTES.BASE, swaggerUi.serve, swaggerRouter);
}
router.use(ANALYSIS_ROUTES.BASE, analysisRouter);

export default router;
