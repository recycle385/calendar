import { randomUUID } from 'crypto';
import type { RowDataPacket } from 'mysql2';
import request from 'supertest';

import { app } from '../../app';
import pool from '../../config/database';
import { VoteRepository } from '../../repositories/vote.repository';
import { addDateOnlyDays, todayDateOnlyUtc } from '../../utils/dateOnly';
import { generateParticipantToken } from '../../utils/jwt/participantToken';

jest.mock('../../sockets', () => ({ getIO: () => ({ to: () => ({ emit: jest.fn() }) }) }));
jest.setTimeout(30000);

describe('실제 MySQL 날짜별 투표와 동시성', () => {
  const repository = new VoteRepository(pool);
  const dates = [1, 2, 3].map((n) => addDateOnlyDays(todayDateOnlyUtc(), n));
  let ownerId: number;
  let calendarId: number;
  let participantId: number;
  let slug: string;
  let token: string;

  beforeEach(async () => {
    const uuid = randomUUID();
    const [user]: any = await pool.execute(
      "INSERT INTO users (user_uuid, email, oauth_provider, oauth_id, nickname) VALUES (?, ?, 'google', ?, '테스트')",
      [uuid, `${uuid}@test.invalid`, uuid]
    );
    ownerId = user.insertId;
    slug = uuid.slice(0, 16);
    const [calendar]: any = await pool.execute(
      `INSERT INTO calendars
        (slug, title, owner_id, start_date, end_date, vote_start_date, vote_end_date, expired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, '투표 테스트', ownerId, dates[0], dates[2], todayDateOnlyUtc(), dates[2], addDateOnlyDays(dates[2], 30)]
    );
    calendarId = calendar.insertId;
    const participantUuid = randomUUID();
    const [participant]: any = await pool.execute(
      "INSERT INTO participants (participant_uuid, calendar_id, nickname, role) VALUES (?, ?, '참가자', 'guest')",
      [participantUuid, calendarId]
    );
    participantId = participant.insertId;
    for (const date of [...dates].reverse()) {
      await pool.execute('INSERT INTO date_options (calendar_id, date_value) VALUES (?, ?)', [
        calendarId,
        date,
      ]);
    }
    token = generateParticipantToken({
      sub: participantUuid,
      role: 'guest',
      nickname: '참가자',
      calendarSlug: slug,
    });
  });
  afterEach(async () => {
    await pool.execute('DELETE FROM users WHERE id = ?', [ownerId]);
  });
  afterAll(async () => {
    await pool.end();
  });

  const readVotes = async (id: number) => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT d.date_value AS date, v.vote_type AS voteType FROM votes v JOIN date_options d ON d.id = v.date_option_id WHERE v.participant_id = ? ORDER BY d.date_value',
      [id]
    );
    return rows;
  };
  const submit = (votes: unknown) =>
    request(app)
      .post(`/api/v1/calendars/${slug}/votes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ votes });

  it('DB 반환 순서와 관계없이 각 날짜의 상태를 저장하고 누락 날짜와 빈 목록은 취소한다', async () => {
    const votes = [
      { date: dates[0], voteType: 'available' },
      { date: dates[1], voteType: 'maybe' },
      { date: dates[2], voteType: 'unavailable' },
    ];
    const response = await submit(votes).expect(200);
    expect(response.body).toMatchObject({ votes, votedCount: 3 });
    expect(response.body.selectedDates).toBeUndefined();
    expect(await readVotes(participantId)).toEqual(votes);
    await submit([votes[1]]).expect(200);
    expect(await readVotes(participantId)).toEqual([votes[1]]);
    await submit([]).expect(200);
    expect(await readVotes(participantId)).toEqual([]);
  });

  it('다른 날짜/중복 날짜/비활성 날짜는 기존 투표를 훼손하지 않는다', async () => {
    const initial = [{ date: dates[0], voteType: 'available' }];
    await submit(initial).expect(200);
    await submit([{ date: addDateOnlyDays(dates[2], 1), voteType: 'maybe' }]).expect(400);
    await submit([initial[0], { ...initial[0], voteType: 'maybe' }]).expect(400);
    await pool.execute(
      'UPDATE date_options SET is_enabled = FALSE WHERE calendar_id = ? AND date_value = ?',
      [calendarId, dates[1]]
    );
    await submit([{ date: dates[1], voteType: 'maybe' }]).expect(400);
    expect(await readVotes(participantId)).toEqual(initial);
  });

  it('다른 캘린더 참가자와 이미 마감된 캘린더는 트랜잭션 안에서 거부한다', async () => {
    const [other]: any = await pool.execute(
      `INSERT INTO calendars
        (slug, title, owner_id, start_date, end_date, vote_start_date, vote_end_date, expired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID().slice(0, 16), '다른 캘린더', ownerId, dates[0], dates[2], todayDateOnlyUtc(), dates[2], addDateOnlyDays(dates[2], 30)]
    );
    await pool.execute('UPDATE participants SET calendar_id = ? WHERE id = ?', [
      other.insertId,
      participantId,
    ]);
    await expect(
      repository.replaceParticipantVotes(participantId, calendarId, [])
    ).rejects.toMatchObject({ statusCode: 403 });
    await pool.execute('UPDATE participants SET calendar_id = ? WHERE id = ?', [
      calendarId,
      participantId,
    ]);
    await pool.execute('UPDATE calendars SET is_closed = TRUE WHERE id = ?', [calendarId]);
    await submit([{ date: dates[0], voteType: 'available' }]).expect(400);
  });

  it('투표 기간이 끝난 캘린더는 아직 자동 마감 전이어도 저장하지 않는다', async () => {
    await pool.execute('UPDATE calendars SET vote_end_date = ? WHERE id = ?', [
      addDateOnlyDays(todayDateOnlyUtc(), -1),
      calendarId,
    ]);
    await submit([{ date: dates[0], voteType: 'available' }]).expect(400);
    expect(await readVotes(participantId)).toEqual([]);
  });

  it('투표 시작일 전에는 투표를 저장하지 않는다', async () => {
    await pool.execute('UPDATE calendars SET vote_start_date = ? WHERE id = ?', [
      addDateOnlyDays(todayDateOnlyUtc(), 1),
      calendarId,
    ]);
    await submit([{ date: dates[0], voteType: 'available' }]).expect(400);
    expect(await readVotes(participantId)).toEqual([]);
  });

  it('같은 참가자의 동시 제출 결과는 한 요청의 완전한 목록이며 서로 섞이지 않는다', async () => {
    const left = [
      { date: dates[0], voteType: 'available' as const },
      { date: dates[1], voteType: 'maybe' as const },
    ];
    const right = [{ date: dates[2], voteType: 'unavailable' as const }];
    await Promise.all(
      Array.from({ length: 16 }, (_, n) =>
        repository.replaceParticipantVotes(participantId, calendarId, n % 2 ? left : right)
      )
    );
    expect([left, right]).toContainEqual(await readVotes(participantId));
  });

  it('여러 참가자의 첫 투표와 반복 교체가 동시에 완료된다', async () => {
    const ids: number[] = [];
    for (let n = 0; n < 8; n++) {
      const [result]: any = await pool.execute(
        'INSERT INTO participants (participant_uuid, calendar_id, nickname) VALUES (?, ?, ?)',
        [randomUUID(), calendarId, `동시${n}`]
      );
      ids.push(result.insertId);
    }
    const votes = [
      { date: dates[0], voteType: 'available' as const },
      { date: dates[2], voteType: 'maybe' as const },
    ];
    for (let round = 0; round < 3; round++) {
      await Promise.all(ids.map((id) => repository.replaceParticipantVotes(id, calendarId, votes)));
    }
    for (const id of ids) expect(await readVotes(id)).toEqual(votes);
  });

  it('삭제 후 삽입에 실패하면 실제 DB에서 이전 투표를 복원한다', async () => {
    const initial = [{ date: dates[0], voteType: 'available' as const }];
    await repository.replaceParticipantVotes(participantId, calendarId, initial);
    const connection = await pool.getConnection();
    const originalQuery = connection.query.bind(connection);
    const querySpy = jest.spyOn(connection, 'query').mockImplementation(((
      sql: string,
      values: unknown
    ) => {
      if (sql.startsWith('INSERT INTO votes'))
        return Promise.reject(new Error('injected insert failure'));
      return (originalQuery as any)(sql, values);
    }) as any);
    const failing = new VoteRepository({ getConnection: async () => connection } as never);
    try {
      await expect(
        failing.replaceParticipantVotes(participantId, calendarId, [
          { date: dates[1], voteType: 'maybe' },
        ])
      ).rejects.toThrow('injected insert failure');
    } finally {
      querySpy.mockRestore();
    }
    expect(await readVotes(participantId)).toEqual(initial);
  });
});
