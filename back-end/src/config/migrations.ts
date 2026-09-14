import { RowDataPacket } from 'mysql2';

import { logger } from '../middlewares/logger';
import pool from './database';

interface CountRow extends RowDataPacket {
  count: number;
}

async function hasIndex(tableName: string, indexName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND index_name = ?`,
    [tableName, indexName]
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [tableName, columnName]
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

async function migrateCalendarLifecycleFields(): Promise<void> {
  const addedVoteStart = !(await hasColumn('calendars', 'vote_start_date'));
  const addedVoteEnd = !(await hasColumn('calendars', 'vote_end_date'));
  const addedUpdatedAt = !(await hasColumn('calendars', 'updated_at'));

  if (addedVoteStart) {
    await pool.query('ALTER TABLE calendars ADD COLUMN vote_start_date DATE NULL AFTER end_date');
  }
  if (addedVoteEnd) {
    await pool.query(
      'ALTER TABLE calendars ADD COLUMN vote_end_date DATE NULL AFTER vote_start_date'
    );
  }
  if (addedUpdatedAt) {
    await pool.query(
      'ALTER TABLE calendars ADD COLUMN updated_at TIMESTAMP NULL AFTER created_at'
    );
  }

  if (addedVoteStart || addedVoteEnd || addedUpdatedAt) {
    await pool.query(
      `UPDATE calendars
       SET vote_start_date = COALESCE(vote_start_date, DATE(created_at)),
           vote_end_date = COALESCE(vote_end_date, end_date),
           updated_at = COALESCE(updated_at, created_at)`
    );
    await pool.query(
      `ALTER TABLE calendars
       MODIFY COLUMN vote_start_date DATE NOT NULL,
       MODIFY COLUMN vote_end_date DATE NOT NULL,
       MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    );
    logger.info('[Migration] 캘린더 투표 기간 및 수정 시각 필드 적용 완료');
  }

  if (!(await hasIndex('calendars', 'idx_vote_period'))) {
    await pool.query('ALTER TABLE calendars ADD INDEX idx_vote_period (vote_start_date, vote_end_date)');
  }
}

async function migrateDateInfoUniqueKey(): Promise<void> {
  const changes: string[] = [];
  for (const index of ['unique_date_seq', 'unique_date_kind_seq']) {
    if (await hasIndex('date_info', index)) changes.push(`DROP INDEX ${index}`);
  }
  if (!(await hasIndex('date_info', 'unique_date_kind_seq_source'))) {
    changes.push(
      'ADD UNIQUE KEY unique_date_kind_seq_source (location_date, date_kind, seq, data_source)'
    );
  }
  if (changes.length === 0) return;

  // 한 번의 DDL로 교체해 기존 제약만 제거된 상태가 남지 않도록 한다.
  await pool.query(`ALTER TABLE date_info ${changes.join(', ')}`);
  logger.info('[Migration] date_info 출처별 유니크 키 적용 완료');
}

export async function runDatabaseMigrations(): Promise<void> {
  await migrateCalendarLifecycleFields();
  await migrateDateInfoUniqueKey();
}
