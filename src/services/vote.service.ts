import { DateVoteInput, DateVoteStatus, VoteRecordForParticipant } from '../models/Vote';
import { IDateOptionRepository } from '../repositories/dateOption.repository';
import { IVoteRepository } from '../repositories/vote.repository';
import { normalizeDateOnly } from '../utils/dateOnly';
import { Errors } from '../utils/errors';

export interface IVoteService {
  submitVotes(participantId: number, calendarId: number, votes: DateVoteInput[]): Promise<number>;
  getVotesByParticipant(participantId: number): Promise<VoteRecordForParticipant[]>;
  getVoteStatusByCalendar(calendarId: number): Promise<DateVoteStatus[]>;
  deleteVotes(participantId: number): Promise<void>;
}

export class VoteService implements IVoteService {
  constructor(
    private voteRepository: IVoteRepository,
    private dateOptionRepository: IDateOptionRepository
  ) {}

  /**
   * 참가자의 투표 제출 (복수 날짜)
   */
  async submitVotes(
    participantId: number,
    calendarId: number,
    votes: DateVoteInput[]
  ): Promise<number> {
    if (!Array.isArray(votes) || votes.length > 366)
      throw Errors.BadRequest('투표 목록이 올바르지 않습니다');
    const dates = new Set<string>();
    const normalized = votes.map((vote) => {
      if (!vote || !['available', 'unavailable', 'maybe'].includes(vote.voteType)) {
        throw Errors.BadRequest('유효하지 않은 투표 타입입니다');
      }
      let date: string;
      try {
        date = normalizeDateOnly(vote.date);
      } catch {
        throw Errors.BadRequest('날짜는 유효한 YYYY-MM-DD 형식이어야 합니다');
      }
      if (dates.has(date)) throw Errors.BadRequest('중복된 날짜가 포함되어 있습니다');
      dates.add(date);
      return { date, voteType: vote.voteType };
    });
    return this.voteRepository.replaceParticipantVotes(participantId, calendarId, normalized);
  }

  /**
   * 참가자의 투표 내역 조회
   */
  async getVotesByParticipant(participantId: number): Promise<VoteRecordForParticipant[]> {
    const votes = await this.voteRepository.findAllByParticipant(participantId);

    if (votes.length === 0) {
      return [];
    }
    const idArray = votes.map((s) => s.date_option_id);

    const dateOptions = await this.dateOptionRepository.findOptionsByIds(idArray);

    if (idArray.length !== dateOptions.length) {
      throw Errors.Internal('내부오류');
    }

    const dateOptionMap = new Map(dateOptions.map((option) => [option.id, option]));

    return votes
      .filter((vote) => dateOptionMap.has(vote.date_option_id))
      .map((vote) => {
        const dateOption = dateOptionMap.get(vote.date_option_id)!;
        return {
          vote_id: vote.id,
          date_value: dateOption.date_value,
          vote_type: vote.vote_type,
          created_at: vote.created_at,
        };
      });
  }

  /**
   * 캘린더의 날짜별 투표 현황 조회
   */
  async getVoteStatusByCalendar(calendarId: number): Promise<DateVoteStatus[]> {
    return await this.voteRepository.getDateVoteStatus(calendarId);
  }

  /**
   * 참가자의 모든 투표 삭제
   */
  async deleteVotes(participantId: number): Promise<void> {
    await this.voteRepository.deleteAllByParticipant(participantId);
  }
}
