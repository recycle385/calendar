import { VoteRepository } from '../../../repositories/vote.repository';

describe('투표 트랜잭션 재시도', () => {
  const makeConnection = (failure?: Error) => ({
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
    execute: failure
      ? jest.fn().mockRejectedValue(failure)
      : jest
          .fn()
          .mockResolvedValueOnce([
            [{ is_closed: 0, vote_start_date: '2000-01-01', vote_end_date: '2099-12-31' }],
          ])
          .mockResolvedValueOnce([[{ calendar_id: 10 }]])
          .mockResolvedValueOnce([[]]),
    query: jest.fn(),
  });

  it('데드락이면 롤백과 연결 반환 후 새 트랜잭션에서 다시 검증한다', async () => {
    const first = makeConnection(
      Object.assign(new Error('deadlock'), { code: 'ER_LOCK_DEADLOCK' })
    );
    const second = makeConnection();
    const getConnection = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const repository = new VoteRepository({ getConnection } as never);
    expect(await repository.replaceParticipantVotes(1, 10, [])).toBe(0);
    expect(first.rollback).toHaveBeenCalledTimes(1);
    expect(first.release).toHaveBeenCalledTimes(1);
    expect(second.beginTransaction).toHaveBeenCalledTimes(1);
    expect(second.commit).toHaveBeenCalledTimes(1);
    expect(second.execute).toHaveBeenCalledWith(
      'SELECT calendar_id FROM participants WHERE id = ? FOR UPDATE',
      [1]
    );
  });

  it.each([
    ['ER_LOCK_DEADLOCK', 3],
    ['ER_BAD_FIELD_ERROR', 1],
  ])('%s는 최대 %s회 시도한다', async (code, attempts) => {
    const connections: ReturnType<typeof makeConnection>[] = [];
    const getConnection = jest.fn(async () => {
      const connection = makeConnection(Object.assign(new Error('failure'), { code }));
      connections.push(connection);
      return connection;
    });
    await expect(
      new VoteRepository({ getConnection } as never).replaceParticipantVotes(1, 10, [])
    ).rejects.toThrow('failure');
    expect(getConnection).toHaveBeenCalledTimes(attempts);
    for (const connection of connections) {
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
    }
  });

  it('한국 날짜로 시작일이 된 오전 9시 이전에도 투표를 허용한다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-16T15:30:00.000Z'));
    const connection = {
      ...makeConnection(),
      execute: jest
        .fn()
        .mockResolvedValueOnce([
          [{ is_closed: 0, vote_start_date: '2026-09-17', vote_end_date: '2026-09-17' }],
        ])
        .mockResolvedValueOnce([[{ calendar_id: 10 }]])
        .mockResolvedValueOnce([[]]),
    };
    const repository = new VoteRepository({
      getConnection: jest.fn().mockResolvedValue(connection),
    } as never);

    await expect(repository.replaceParticipantVotes(1, 10, [])).resolves.toBe(0);
    expect(connection.commit).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('한국 날짜로 종료일 다음 날이 되면 자정부터 투표를 거절한다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-17T15:00:00.000Z'));
    const connection = {
      ...makeConnection(),
      execute: jest.fn().mockResolvedValueOnce([
        [{ is_closed: 0, vote_start_date: '2026-09-17', vote_end_date: '2026-09-17' }],
      ]),
    };
    const repository = new VoteRepository({
      getConnection: jest.fn().mockResolvedValue(connection),
    } as never);

    await expect(repository.replaceParticipantVotes(1, 10, [])).rejects.toThrow(
      '투표 기간이 종료되었습니다'
    );
    expect(connection.rollback).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
