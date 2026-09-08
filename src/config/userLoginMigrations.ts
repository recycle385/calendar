import type { RowDataPacket } from 'mysql2';

import { logger } from '../middlewares/logger';
import pool from './database';

export async function ensureExplicitUserLoginTimestamp(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT EXTRA AS extra FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login_at'`
  );
  if (!rows.length) throw new Error('users.last_login_at 컬럼을 찾을 수 없습니다.');
  if (!/on update/i.test(rows[0].extra)) return;

  await pool.query(
    'ALTER TABLE users MODIFY COLUMN last_login_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
  );
  logger.info('[Migration] last_login_at 자동 갱신 제거 완료');
}
