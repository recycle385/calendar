import { RequestHandler } from 'express';

import { IAnalysisService } from '../services/analysis.service';
import { Errors } from '../utils/errors';

export class AnalysisController {
  constructor(private analysisService: IAnalysisService) {}

  public analyze: RequestHandler = async (req, res) => {
    const { slug } = req.params;
    const { question } = req.body as { question: string };
    const participantUuid = req.participantUuid;

    if (!participantUuid) throw Errors.Unauthorized('참가자 인증이 필요합니다');

    const response = await this.analysisService.analyze(
      slug,
      participantUuid,
      req.calendarSlug,
      question
    );

    return res.status(200).json(response);
  };
}
