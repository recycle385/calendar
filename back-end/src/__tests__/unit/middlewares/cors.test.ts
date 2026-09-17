import express from 'express';
import request from 'supertest';

import { env } from '../../../config/env';
import { corsMiddleware } from '../../../middlewares/cors';

describe('CORS preflight', () => {
  const app = express();
  app.use(corsMiddleware);
  app.post('/reconciliation', (_req, res) => res.sendStatus(204));

  it('참여 기록 통합용 참가자 토큰 헤더를 허용한다', async () => {
    const response = await request(app)
      .options('/reconciliation')
      .set('Origin', env.CLIENT_URL)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,x-participant-token')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(env.CLIENT_URL);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain(
      'x-participant-token'
    );
  });
});
