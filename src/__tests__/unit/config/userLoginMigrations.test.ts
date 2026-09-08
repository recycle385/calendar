import fs from 'fs';

import pool from '../../../config/database';
import { ensureExplicitUserLoginTimestamp } from '../../../config/userLoginMigrations';

jest.mock('../../../config/database', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../../middlewares/logger', () => ({ logger: { info: jest.fn() } }));

describe('로그인 시각 자동 갱신 제거', () => {
  const query = pool.query as jest.Mock;
  beforeEach(() => query.mockReset());

  it('기존 기록을 덮어쓰지 않고 ON UPDATE 속성만 제거한다', async () => {
    query
      .mockResolvedValueOnce([[{ extra: 'DEFAULT_GENERATED on update CURRENT_TIMESTAMP' }]])
      .mockResolvedValueOnce([{}]);
    await ensureExplicitUserLoginTimestamp();
    expect(query.mock.calls[1][0]).toBe(
      'ALTER TABLE users MODIFY COLUMN last_login_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    );
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('이미 적용된 DB에서는 DDL을 반복하지 않는다', async () => {
    query.mockResolvedValue([[{ extra: 'DEFAULT_GENERATED' }]]);
    await ensureExplicitUserLoginTimestamp();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('신규 DB의 로그인 시각도 일반 수정에 연동되지 않는다', () => {
    const schema = fs.readFileSync('src/models/schema/calendar_db.sql', 'utf8');
    expect(schema).toMatch(/last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,/);
  });
});
