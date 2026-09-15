import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';

import dbpool from '../config/database';
import { CreateVoteInput, DateVoteInput, DateVoteStatus, Vote, VoteType } from '../models/Vote';
import { compareDateOnly, formatDateOnly, todayDateOnlyUtc } from '../utils/dateOnly';
import { Errors } from '../utils/errors';

export interface IVoteRepository {
  // 투표 생성/수정
  upsertVote(input: CreateVoteInput, connection?: PoolConnection): Promise<Vote>;
  replaceParticipantVotes(
    participantId: number,
    calendarId: number,
    votes: DateVoteInput[]
  ): Promise<number>;

  // 투표 조회
  findByParticipantAndDateOption(
    participantId: number,
    dateOptionId: number,
    connection?: PoolConnection
  ): Promise<Vote | null>;
  findAllByParticipant(participantId: number, connection?: PoolConnection): Promise<Vote[]>;
  findAllByCalendar(calendarId: number, connection?: PoolConnection): Promise<Vote[]>;

  // 투표 삭제
  delete(participantId: number, dateOptionId: number): Promise<boolean>;
  deleteAllByParticipant(participantId: number, connection?: PoolConnection): Promise<number>;
  replaceVotesFromParticipant(
    targetParticipantId: number,
    sourceParticipantId: number,
    connection: PoolConnection
  ): Promise<number>;

  // 날짜별 투표 현황
  getDateVoteStatus(calendarId: number): Promise<DateVoteStatus[]>;
}

export class VoteRepository implements IVoteRepository {
  constructor(private pool = dbpool) {}
  /**
   * 투표 생성 또는 수정 (UPSERT)
   */
  async upsertVote(input: CreateVoteInput, connection?: PoolConnection): Promise<Vote> {
    const poolToUse = connection || this.pool;
    const { participant_id, date_option_id, vote_type } = input;

    await poolToUse.execute(
      `INSERT INTO votes (participant_id, date_option_id, vote_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         vote_type = VALUES(vote_type),
         updated_at = CURRENT_TIMESTAMP`,
      [participant_id, date_option_id, vote_type]
    );

    const vote = await this.findByParticipantAndDateOption(
      participant_id,
      date_option_id,
      connection
    );
    if (!vote) {
      throw Errors.Internal('투표 생성 후 조회 실패');
    }

    return vote;
  }

  /**
   * 참가자의 기존 투표를 현재 선택 목록으로 교체
   */
  async replaceParticipantVotes(
    participantId: number,
    calendarId: number,
    votes: DateVoteInput[]
  ): Promise<number> {
    // 같은 참가자는 행 잠금으로 직렬화하며, 다른 작업과의 교착은 트랜잭션 전체를 재시도한다.
    for (let attempt = 0; ; attempt++) {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        const count = await this.replaceVotes(connection, participantId, calendarId, votes);
        await connection.commit();
        return count;
      } catch (error) {
        await connection.rollback();
        if (attempt >= 2 || (error as { code?: string }).code !== 'ER_LOCK_DEADLOCK') throw error;
      } finally {
        connection.release();
      }
    }
  }

  private async replaceVotes(
    connection: PoolConnection,
    participantId: number,
    calendarId: number,
    votes: DateVoteInput[]
  ): Promise<number> {
    // 캘린더 → 참가자 → 날짜 옵션 → 투표 순서로 잠근다.
    // 공유 잠금은 다른 참가자의 투표를 허용하면서 마감/기간 수정/삭제와의 경합을 막는다.
    const [calendars] = await connection.execute<RowDataPacket[]>(
      'SELECT is_closed, vote_start_date, vote_end_date FROM calendars WHERE id = ? FOR SHARE',
      [calendarId]
    );
    if (!calendars.length) throw Errors.NotFound('캘린더를 찾을 수 없습니다');
    if (calendars[0].is_closed) throw Errors.BadRequest('마감된 캘린더에는 투표할 수 없습니다');
    const today = todayDateOnlyUtc();
    if (compareDateOnly(today, formatDateOnly(calendars[0].vote_start_date)) < 0) {
      throw Errors.BadRequest('투표 기간이 시작되지 않았습니다');
    }
    if (compareDateOnly(today, formatDateOnly(calendars[0].vote_end_date)) > 0) {
      throw Errors.BadRequest('투표 기간이 종료되었습니다');
    }
    const [participants] = await connection.execute<RowDataPacket[]>(
      'SELECT calendar_id FROM participants WHERE id = ? FOR UPDATE',
      [participantId]
    );
    if (!participants.length || participants[0].calendar_id !== calendarId) {
      throw Errors.Forbidden('이 캘린더의 참가자가 아닙니다');
    }

    const typesByDate = new Map(votes.map((vote) => [vote.date, vote.voteType]));
    const options = votes.length
      ? (
          await connection.query<RowDataPacket[]>(
            'SELECT id, date_value, is_enabled FROM date_options WHERE calendar_id = ? AND date_value IN (?) ORDER BY id FOR SHARE',
            [calendarId, [...typesByDate.keys()].sort()]
          )
        )[0]
      : [];
    if (options.length !== votes.length)
      throw Errors.BadRequest('유효하지 않은 날짜가 포함되어 있습니다');
    if (options.some((option) => !option.is_enabled))
      throw Errors.BadRequest('비활성화된 날짜입니다');

    // 참가자 행 잠금을 보유한 채 기존 PK만 삭제한다. 빈 범위 DELETE의 gap lock 경합을 피한다.
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM votes WHERE participant_id = ? ORDER BY id',
      [participantId]
    );
    if (existing.length) {
      await connection.query('DELETE FROM votes WHERE id IN (?)', [existing.map((row) => row.id)]);
    }
    if (options.length) {
      const values = options.map((option) => [
        participantId,
        option.id,
        typesByDate.get(formatDateOnly(option.date_value)),
      ]);
      await connection.query(
        'INSERT INTO votes (participant_id, date_option_id, vote_type) VALUES ?',
        [values]
      );
    }
    return votes.length;
  }

  /**
   * 참가자 + 날짜 옵션으로 투표 조회
   */
  async findByParticipantAndDateOption(
    participantId: number,
    dateOptionId: number,
    connection?: PoolConnection
  ): Promise<Vote | null> {
    const poolToUse = connection || this.pool;

    const [rows] = await poolToUse.execute<RowDataPacket[]>(
      'SELECT * FROM votes WHERE participant_id = ? AND date_option_id = ?',
      [participantId, dateOptionId]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapToVote(rows[0]);
  }

  /**
   * 참가자의 모든 투표 조회
   */
  async findAllByParticipant(participantId: number, connection?: PoolConnection): Promise<Vote[]> {
    const poolToUse = connection || this.pool;

    const [rows] = await poolToUse.execute<RowDataPacket[]>(
      'SELECT * FROM votes WHERE participant_id = ? ORDER BY created_at ASC',
      [participantId]
    );

    return rows.map((row) => this.mapToVote(row));
  }

  /**
   * 캘린더의 모든 투표 조회
   */
  async findAllByCalendar(calendarId: number, connection?: PoolConnection): Promise<Vote[]> {
    const poolToUse = connection || this.pool;

    const [rows] = await poolToUse.execute<RowDataPacket[]>(
      `SELECT v.*
       FROM votes v
       JOIN date_options d ON v.date_option_id = d.id
       WHERE d.calendar_id = ?

       ORDER BY v.created_at ASC`,
      [calendarId]
    );

    return rows.map((row) => this.mapToVote(row));
  }

  /**
   * 투표 삭제
   */
  async delete(
    participantId: number,
    dateOptionId: number,
    connection?: PoolConnection
  ): Promise<boolean> {
    const poolToUse = connection || this.pool;

    const [result] = await poolToUse.execute<ResultSetHeader>(
      'DELETE FROM votes WHERE participant_id = ? AND date_option_id = ?',
      [participantId, dateOptionId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 참가자의 모든 투표 삭제
   */
  async deleteAllByParticipant(
    participantId: number,
    connection?: PoolConnection
  ): Promise<number> {
    const poolToUse = connection || this.pool;

    const [result] = await poolToUse.execute<ResultSetHeader>(
      'DELETE FROM votes WHERE participant_id = ?',
      [participantId]
    );

    return result.affectedRows;
  }

  async replaceVotesFromParticipant(
    targetParticipantId: number,
    sourceParticipantId: number,
    connection: PoolConnection
  ): Promise<number> {
    await this.deleteAllByParticipant(targetParticipantId, connection);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO votes (participant_id, date_option_id, vote_type)
       SELECT ?, date_option_id, vote_type FROM votes WHERE participant_id = ?`,
      [targetParticipantId, sourceParticipantId]
    );
    return result.affectedRows;
  }

  /**
   * 날짜별 투표 현황 조회 (그래프용)
   */
  async getDateVoteStatus(
    calendarId: number,
    connection?: PoolConnection
  ): Promise<DateVoteStatus[]> {
    const poolToUse = connection || this.pool;

    const [rows] = await poolToUse.execute<RowDataPacket[]>(
      `SELECT
        d.id as date_option_id,
        d.date_value,
        d.is_enabled,
        p.id as participant_id,
        p.nickname as participant_nickname,
        p.color_code as participant_color,
        v.vote_type
       FROM date_options d
       LEFT JOIN votes v ON d.id = v.date_option_id
       LEFT JOIN participants p ON v.participant_id = p.id
       WHERE d.calendar_id = ?
       ORDER BY d.date_value ASC, p.joined_at ASC`,
      [calendarId]
    );

    // 날짜별로 그룹화
    const dateMap = new Map<number, DateVoteStatus>();

    for (const row of rows) {
      const dateOptionId = row.date_option_id;

      if (!dateMap.has(dateOptionId)) {
        dateMap.set(dateOptionId, {
          date_option_id: dateOptionId,
          date_value: formatDateOnly(row.date_value),
          is_enabled: Boolean(row.is_enabled),
          votes: [],
        });
      }

      // 투표가 있는 경우에만 추가
      if (row.participant_id) {
        dateMap.get(dateOptionId)!.votes.push({
          participant_id: row.participant_id,
          participant_nickname: row.participant_nickname,
          participant_color: row.participant_color,
          vote_type: row.vote_type,
        });
      }
    }

    return Array.from(dateMap.values());
  }

  private mapToVote(row: RowDataPacket): Vote {
    return {
      id: row.id,
      participant_id: row.participant_id,
      date_option_id: row.date_option_id,
      vote_type: row.vote_type as VoteType,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
