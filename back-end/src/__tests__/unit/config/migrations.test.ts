import fs from 'fs';
import path from 'path';

import pool from '../../../config/database';
import { runDatabaseMigrations } from '../../../config/migrations';

jest.mock('../../../config/database', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../../middlewares/logger', () => ({ logger: { info: jest.fn() } }));

describe('공휴일 출처별 유니크 키 마이그레이션', () => {
  const query = pool.query as jest.Mock;

  it.each(['unique_date_seq', 'unique_date_kind_seq'])(
    '%s에서 기존 데이터 삭제 없이 제약을 한 번에 교체한다',
    async (oldKey) => {
      query.mockReset().mockImplementation(async (sql: string, params?: string[]) => {
        if (sql.includes('information_schema.columns')) return [[{ count: 1 }]];
        if (sql.includes('information_schema.statistics')) {
          const name = params?.[1];
          return [[{ count: name === oldKey || name === 'idx_vote_period' ? 1 : 0 }]];
        }
        return [{}];
      });
      await runDatabaseMigrations();
      const mutations = query.mock.calls.filter(([sql]) => !sql.includes('information_schema'));
      expect(mutations).toEqual([
        [
          `ALTER TABLE date_info DROP INDEX ${oldKey}, ADD UNIQUE KEY unique_date_kind_seq_source (location_date, date_kind, seq, data_source)`,
        ],
      ]);
    }
  );

  it('출처별 키 적용 후 재시작하면 이전 키를 다시 생성하지 않는다', async () => {
    query
      .mockReset()
      .mockImplementation(async (sql: string, params?: string[]) => {
        if (sql.includes('information_schema.columns')) return [[{ count: 1 }]];
        return [[{ count: ['idx_vote_period', 'unique_date_kind_seq_source'].includes(params?.[1] ?? '') ? 1 : 0 }]];
      });
    await runDatabaseMigrations();
    expect(query.mock.calls.every(([sql]) => sql.includes('information_schema'))).toBe(true);
  });

  it('신규 DB도 공공 데이터와 직접 등록 데이터에 같은 날짜와 순번을 허용한다', () => {
    const schema = fs.readFileSync(
      path.join(process.cwd(), 'src/models/schema/calendar_db.sql'),
      'utf8'
    );
    expect(schema).toContain(
      'UNIQUE KEY unique_date_kind_seq_source (location_date, date_kind, seq, data_source)'
    );
    expect(schema).not.toMatch(/UNIQUE KEY unique_date_kind_seq\s*\(/);
  });

  it('기존 캘린더에 투표 기간과 수정 시각을 백필하고 NOT NULL로 전환한다', async () => {
    query.mockReset().mockImplementation(async (sql: string, params?: string[]) => {
      if (sql.includes('information_schema.columns')) return [[{ count: 0 }]];
      if (sql.includes('information_schema.statistics')) {
        return [[{ count: params?.[1] === 'unique_date_kind_seq_source' ? 1 : 0 }]];
      }
      return [{}];
    });

    await runDatabaseMigrations();

    const statements = query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ADD COLUMN vote_start_date'),
        expect.stringContaining('ADD COLUMN vote_end_date'),
        expect.stringContaining('ADD COLUMN updated_at'),
        expect.stringContaining('vote_start_date = COALESCE(vote_start_date, DATE(created_at))'),
        expect.stringContaining('MODIFY COLUMN vote_start_date DATE NOT NULL'),
        expect.stringContaining('ADD INDEX idx_vote_period'),
      ])
    );
  });
});
