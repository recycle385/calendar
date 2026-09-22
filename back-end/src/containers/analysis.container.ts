import { AnalysisController } from '../controllers/analysis.controller';
import { AnalysisLlmService } from '../services/analysis.llm';
import { AnalysisService } from '../services/analysis.service';
import { calendarService, participantService, voteService } from './service.container';

const analysisLlmService = new AnalysisLlmService();
const analysisService = new AnalysisService(
  calendarService,
  participantService,
  voteService,
  analysisLlmService
);

export const analysisController = new AnalysisController(analysisService);
