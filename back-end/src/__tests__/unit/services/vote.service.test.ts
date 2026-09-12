import { IDateOptionRepository } from '../../../repositories/dateOption.repository';
import { IVoteRepository } from '../../../repositories/vote.repository';
import { VoteService } from '../../../services/vote.service';
import { voteSchemas } from '../../../middlewares/validation';

describe('날짜별 투표 요청', () => {
  const replaceParticipantVotes = jest.fn();
  const getDateVoteStatus = jest.fn();
  const service = new VoteService(
    { replaceParticipantVotes, getDateVoteStatus } as unknown as IVoteRepository,
    {} as IDateOptionRepository
  );
  beforeEach(() => jest.resetAllMocks());

  it('날짜마다 다른 상태를 전달하고 최종 투표 수를 반환한다', async () => {
    const votes = [
      { date: '2026-09-10', voteType: 'available' as const },
      { date: '2026-09-11', voteType: 'maybe' as const },
      { date: '2026-09-12', voteType: 'unavailable' as const },
    ];
    replaceParticipantVotes.mockResolvedValue(3);
    expect(await service.submitVotes(1, 10, votes)).toBe(3);
    expect(replaceParticipantVotes).toHaveBeenCalledWith(1, 10, votes);
  });

  it('빈 목록은 전체 투표 취소로 전달한다', async () => {
    replaceParticipantVotes.mockResolvedValue(0);
    expect(await service.submitVotes(1, 10, [])).toBe(0);
    expect(replaceParticipantVotes).toHaveBeenCalledWith(1, 10, []);
  });

  it.each([
    [
      { date: '2026-09-10', voteType: 'maybe' },
      { date: ' 2026-09-10 ', voteType: 'available' },
    ],
    [{ date: '2026-02-30', voteType: 'available' }],
    [{ date: '2026-09-10T00:00:00Z', voteType: 'available' }],
    [{ date: '2026-09-10', voteType: 'unknown' }],
  ])('잘못된 투표 목록은 저장하지 않는다: %p', async (...votes) => {
    await expect(service.submitVotes(1, 10, votes as never)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(replaceParticipantVotes).not.toHaveBeenCalled();
  });

  it.each([
    { selectedDates: ['2026-09-10'], voteType: 'available' },
    { votes: [{ date: '2026-09-10' }] },
    { votes: [{ date: '2026-09-10', voteType: 'bad' }] },
    {
      votes: [
        { date: '2026-09-10', voteType: 'maybe' },
        { date: '2026-09-10', voteType: 'available' },
      ],
    },
  ])('요청 스키마가 구형 요청과 잘못된 항목을 거부한다: %p', (body) => {
    expect(voteSchemas.subVoteRequest.validate(body).error).toBeDefined();
  });

  it('빈 목록과 날짜별 상태는 요청 스키마를 통과한다', () => {
    expect(voteSchemas.subVoteRequest.validate({ votes: [] }).error).toBeUndefined();
    expect(
      voteSchemas.subVoteRequest.validate({ votes: [{ date: '2026-09-10', voteType: 'maybe' }] })
        .error
    ).toBeUndefined();
  });

  it('기존 날짜별 투표 현황 조회를 유지한다', async () => {
    getDateVoteStatus.mockResolvedValue([{ date_value: '2026-09-10', votes: [] }]);
    expect(await service.getVoteStatusByCalendar(10)).toEqual([
      { date_value: '2026-09-10', votes: [] },
    ]);
  });
});
