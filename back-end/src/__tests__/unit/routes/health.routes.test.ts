import express from 'express';
import request from 'supertest';

const mockQuery = jest.fn();
const mockRedisState = { isReady: true };

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: { query: mockQuery },
}));
jest.mock('../../../config/redis', () => ({
  redisClient: mockRedisState,
}));

import { healthRouter } from '../../../routes/health.routes';

describe('운영 헬스체크', () => {
  const app = express().use('/health', healthRouter);

  beforeEach(() => {
    mockQuery.mockReset();
    mockRedisState.isReady = true;
  });

  it('프로세스가 실행 중이면 liveness를 반환한다', async () => {
    await request(app).get('/health/live').expect(200, { status: 'ok' });
  });

  it('DB가 연결되면 Redis 장애 중에도 degraded readiness를 반환한다', async () => {
    mockQuery.mockResolvedValue([[{ result: 1 }]]);
    mockRedisState.isReady = false;

    const response = await request(app).get('/health/ready').expect(200);

    expect(response.body).toEqual({
      status: 'degraded',
      database: 'up',
      redis: 'degraded',
    });
  });

  it('DB를 사용할 수 없으면 readiness를 실패시킨다', async () => {
    mockQuery.mockRejectedValue(new Error('database unavailable'));

    const response = await request(app).get('/health/ready').expect(503);

    expect(response.body.status).toBe('not_ready');
  });
});
