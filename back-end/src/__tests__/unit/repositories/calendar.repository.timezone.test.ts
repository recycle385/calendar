import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { CalendarRepository } from '../../../repositories/calendar.repository';

describe('CalendarRepository UTC 기준 조회', () => {
  let mockPool: {
    execute: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    query: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let repository: CalendarRepository;

  beforeEach(() => {
    mockPool = {
      execute: jest.fn(async () => [[]]),
      query: jest.fn(async () => [[]]),
    };
    repository = new CalendarRepository(mockPool as any);
  });

  it('findEndedAndOpen은 DB CURDATE 대신 UTC 날짜 파라미터를 사용해야 한다', async () => {
    await repository.findEndedAndOpen(undefined, new Date('2026-06-08T23:30:00.000Z'));

    expect(mockPool.execute).toHaveBeenCalledWith(
      'SELECT * FROM calendars WHERE is_closed = FALSE AND vote_end_date < ?',
      ['2026-06-08']
    );
  });

  it('findExpired는 DB NOW 대신 UTC datetime 파라미터를 사용해야 한다', async () => {
    await repository.findExpired(undefined, new Date('2026-06-08T23:30:15.000Z'));

    expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM calendars WHERE expired_at < ?', [
      '2026-06-08 23:30:15',
    ]);
  });

  it('수정용 조회는 지정한 트랜잭션 연결에서 행 잠금을 사용한다', async () => {
    const connection = { execute: jest.fn(async () => [[]]) as jest.Mock };
    await repository.findBySlugForUpdate('slug', connection as any);
    expect(connection.execute).toHaveBeenCalledWith(
      'SELECT * FROM calendars WHERE slug = ? FOR UPDATE',
      ['slug']
    );
    expect(mockPool.execute).not.toHaveBeenCalled();
  });

  it('자동 마감 대상도 변경 직전에 같은 트랜잭션 연결로 잠근다', async () => {
    const connection = { execute: jest.fn(async () => [[]]) as jest.Mock };

    await repository.findEndedAndOpenForUpdate(
      connection as any,
      new Date('2026-06-08T23:30:00.000Z')
    );

    expect(connection.execute).toHaveBeenCalledWith(
      'SELECT * FROM calendars WHERE is_closed = FALSE AND vote_end_date < ? FOR UPDATE',
      ['2026-06-08']
    );
    expect(mockPool.execute).not.toHaveBeenCalled();
  });

  it('DATE 컬럼은 Date 객체가 아니라 YYYY-MM-DD 문자열로 매핑해야 한다', async () => {
    mockPool.execute.mockImplementationOnce(async () => [
      [
        {
          id: 1,
          slug: 'slug',
          title: 'title',
          description: null,
          start_date: '2026-06-08',
          end_date: '2026-06-10',
          vote_start_date: '2026-06-01',
          vote_end_date: '2026-06-07',
          is_closed: 0,
          owner_id: 1,
          created_at: '2026-06-01 00:00:00',
          updated_at: '2026-06-02 00:00:00',
          expired_at: '2026-07-10 00:00:00',
        },
      ],
    ]);

    const calendar = await repository.findById(1);

    expect(calendar?.start_date).toBe('2026-06-08');
    expect(calendar?.end_date).toBe('2026-06-10');
    expect(calendar?.vote_start_date).toBe('2026-06-01');
    expect(calendar?.vote_end_date).toBe('2026-06-07');
    expect(calendar?.updated_at).toEqual(new Date('2026-06-02 00:00:00'));
  });

  it('내 캘린더 목록은 현재 참가자 수를 함께 집계한다', async () => {
    mockPool.query.mockImplementationOnce(async () => [
      [
        {
          id: 1,
          slug: 'slug',
          title: 'title',
          description: null,
          start_date: '2026-06-08',
          end_date: '2026-06-10',
          vote_start_date: '2026-06-01',
          vote_end_date: '2026-06-07',
          is_closed: 0,
          owner_id: 1,
          created_at: '2026-06-01 00:00:00',
          updated_at: '2026-06-02 00:00:00',
          expired_at: '2026-07-07 00:00:00',
          hostParticipantUuid: 'host-uuid',
          participant_count: '4',
        },
      ],
    ]);

    const calendars = await repository.getCalAndPUuidDatasByUserIds(1);

    expect(String(mockPool.query.mock.calls[0][0])).toContain('SELECT COUNT(*) FROM participants');
    expect(calendars[0].participant_count).toBe(4);
  });

  it('참여한 캘린더 목록은 역할과 참여 프로필을 함께 반환한다', async () => {
    mockPool.query.mockImplementationOnce(async () => [
      [
        {
          id: 1,
          slug: 'joined-calendar',
          title: '참여 일정',
          description: null,
          start_date: '2026-09-15',
          end_date: '2026-09-20',
          vote_start_date: '2026-09-10',
          vote_end_date: '2026-09-18',
          is_closed: 0,
          owner_id: 2,
          created_at: '2026-09-01 00:00:00',
          updated_at: '2026-09-02 00:00:00',
          expired_at: '2026-10-18 00:00:00',
          hostParticipantUuid: 'host-uuid',
          participant_count: '3',
          participantRole: 'guest',
          profileType: 'alias',
          participantUuid: 'alias-uuid',
          participantNickname: '별명',
        },
      ],
    ]);

    const calendars = await repository.getJoinedCalendarsByUserId(7);

    expect(String(mockPool.query.mock.calls[0][0])).toContain('WHERE me.user_id = ?');
    expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [7]);
    expect(calendars[0]).toEqual(
      expect.objectContaining({
        participantRole: 'guest',
        profileType: 'alias',
        participantUuid: 'alias-uuid',
        participantNickname: '별명',
        participant_count: 3,
      })
    );
  });
});
