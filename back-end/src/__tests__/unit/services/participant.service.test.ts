import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { TransactionManager } from '../../../infrastructure/transaction.manager';
import { Calendar } from '../../../models/Calendar';
import { Participant } from '../../../models/Participant';
import { ICalendarRepository } from '../../../repositories/calendar.repository';
import { IParticipantRepository } from '../../../repositories/participant.repository';
import { ParticipantService } from '../../../services/participant.service';

// 외부 라이브러리 Mocking
jest.mock('bcrypt');
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('../../../infrastructure/transaction.manager', () => ({
  TransactionManager: {
    run: jest.fn((callback: (connection: object) => unknown) => callback({ transaction: true })),
  },
}));

// Repository Mocking
const mockParticipantRepository: jest.Mocked<IParticipantRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUuid: jest.fn(),
  findByUuidForUpdate: jest.fn(),
  existsByUuid: jest.fn(),
  existsByCalendarAndUser: jest.fn(),
  getIdUsingUuid: jest.fn(),
  getUuidUsingId: jest.fn(),
  getParticipantUuidByUserIdAndCalendarId: jest.fn(),
  findUserGuestById: jest.fn(),
  findUserParticipantForUpdate: jest.fn(),
  findByCalendarAndNickname: jest.fn(),
  findAllByCalendarId: jest.fn(),
  findAllByCalendarIdWithVotes: jest.fn(),
  nicknameExists: jest.fn(),
  nicknameExistsExcluding: jest.fn(),
  claimAnonymousParticipant: jest.fn(),
  delete: jest.fn(),
};

const mockCalendarRepository = {
  findById: jest.fn(),
  findByIdForUpdate: jest.fn(),
} as unknown as jest.Mocked<ICalendarRepository>;

const mockVoteRepository = {
  findAllByParticipant: jest.fn(),
  replaceVotesFromParticipant: jest.fn(),
} as any;

describe('ParticipantService Unit Test', () => {
  let participantService: ParticipantService;

  beforeEach(() => {
    // 모든 모의 객체의 호출 기록과 반환값 설정을 초기화합니다.
    jest.resetAllMocks();
    (TransactionManager.run as jest.Mock).mockImplementation(
      (callback: (connection: object) => unknown) => callback({ transaction: true })
    );
    mockParticipantRepository.existsByCalendarAndUser.mockResolvedValue(false);
    mockCalendarRepository.findByIdForUpdate.mockResolvedValue({
      id: 1,
      is_closed: false,
      vote_start_date: '2000-01-01',
      vote_end_date: '2099-12-31',
    } as Calendar);
    mockCalendarRepository.findById.mockResolvedValue({
      id: 1,
      is_closed: false,
      vote_start_date: '2000-01-01',
      vote_end_date: '2099-12-31',
    } as Calendar);
    participantService = new ParticipantService(
      mockParticipantRepository,
      mockCalendarRepository,
      mockVoteRepository
    );
  });

  // =================================================================
  // 1. 참가자 등록 (registerParticipant)
  // =================================================================
  describe('registerParticipant', () => {
    const calendarId = 1;
    const nickname = 'GuestUser';
    const password = 'password123';
    const mockUuid = 'mock-uuid-123';

    beforeEach(() => {
      (randomUUID as jest.Mock).mockReturnValue(mockUuid);
    });

    it('이미 참여한 회원은 다른 닉네임으로도 중복 등록할 수 없다', async () => {
      mockParticipantRepository.existsByCalendarAndUser.mockResolvedValue(true);

      await expect(
        participantService.registerParticipant({
          calendarId,
          userId: 42,
          nickname: '다른 닉네임',
        })
      ).rejects.toThrow('이미 이 캘린더에 참여한 회원입니다');

      expect(mockParticipantRepository.create).not.toHaveBeenCalled();
    });

    it('[성공] Guest 등록 시 닉네임과 해싱된 비밀번호로 생성되어야 한다', async () => {
      const input = { calendarId, nickname, password };
      const hashedPassword = 'hashed_password';

      // Mock 설정
      mockParticipantRepository.nicknameExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword as never);
      mockParticipantRepository.create.mockResolvedValue({
        id: 1,
        participant_uuid: mockUuid,
        nickname,
        role: 'guest',
      } as Participant);

      // 실행
      const result = await participantService.registerParticipant(input);

      // 검증
      expect(mockParticipantRepository.nicknameExists).toHaveBeenCalledWith(
        {
          calendar_id: calendarId,
          nickname,
        },
        expect.anything()
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);

      // 수정됨: Service 코드에서 connection 인자를 넘기지 않으므로 expect.anything() 제거
      expect(mockParticipantRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'guest',
          profile_type: 'password',
          nickname,
          password_hash: hashedPassword,
          participant_uuid: mockUuid,
        }),
        expect.anything()
      );
      expect(result.participantUuid).toBe(mockUuid);
    });

    it('[성공] 로그인한 User가 Guest로 참여 시 userId가 매핑되어야 한다', async () => {
      const userId = 100;
      const input = {
        calendarId,
        nickname,
        userId,
        role: 'guest' as const,
        profileType: 'alias' as const,
      };

      mockParticipantRepository.nicknameExists.mockResolvedValue(false);
      mockParticipantRepository.create.mockResolvedValue({
        id: 2,
        participant_uuid: mockUuid,
        user_id: userId,
        nickname,
      } as Participant);

      // 실행
      await participantService.registerParticipant(input);

      // 검증: 비밀번호 해싱은 호출되지 않아야 함
      expect(bcrypt.hash).not.toHaveBeenCalled();

      // 수정됨: Service 코드에서 connection 인자를 넘기지 않으므로 expect.anything() 제거
      expect(mockParticipantRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'guest',
          profile_type: 'alias',
          user_id: userId,
          nickname,
        }),
        expect.anything()
      );
    });

    it('[실패] 캘린더 내 중복된 닉네임 사용 시 Conflict 에러를 던져야 한다', async () => {
      mockParticipantRepository.nicknameExists.mockResolvedValue(true);

      const input = { calendarId, nickname, password };

      await expect(participantService.registerParticipant(input)).rejects.toThrow(
        '이미 사용 중인 닉네임입니다'
      );
    });

    it('캘린더 행 잠금 뒤 마감 상태를 다시 확인하고 신규 등록을 거부한다', async () => {
      mockCalendarRepository.findByIdForUpdate.mockResolvedValue({
        id: calendarId,
        is_closed: true,
      } as Calendar);

      await expect(
        participantService.registerParticipant({ calendarId, nickname, password })
      ).rejects.toThrow('마감된 캘린더에는 참가할 수 없습니다');

      expect(mockCalendarRepository.findByIdForUpdate).toHaveBeenCalledWith(
        calendarId,
        expect.anything()
      );
      expect(mockParticipantRepository.create).not.toHaveBeenCalled();
    });

    it('[실패] 비밀번호가 너무 짧은 경우 BadRequest 에러를 던져야 한다', async () => {
      // 중요: 이전 테스트의 mockResolvedValue(true)가 영향을 주지 않도록 false로 명시적 설정
      mockParticipantRepository.nicknameExists.mockResolvedValue(false);

      const shortPasswordInput = { calendarId, nickname, password: '123' }; // 4자 미만

      await expect(participantService.registerParticipant(shortPasswordInput)).rejects.toThrow(
        '비밀번호는 최소 4자 이상이어야 합니다'
      );
    });

    it('[실패] 비밀번호가 너무 긴 경우 BadRequest 에러를 던져야 한다', async () => {
      // 중요: 이전 테스트의 영향 방지
      mockParticipantRepository.nicknameExists.mockResolvedValue(false);

      const longPassword = 'a'.repeat(51); // 50자 초과
      const longPasswordInput = { calendarId, nickname, password: longPassword };

      await expect(participantService.registerParticipant(longPasswordInput)).rejects.toThrow(
        '비밀번호는 50자 이하여야 합니다'
      );
    });
  });

  // =================================================================
  // 2. 참가자 로그인 (loginParticipant)
  // =================================================================
  describe('loginParticipant', () => {
    const calendarId = 1;
    const nickname = 'GuestUser';
    const password = 'password123';
    const hashedPassword = 'hashed_password';
    const participant = {
      id: 1,
      participant_uuid: 'uuid-123',
      nickname,
      password_hash: hashedPassword,
      calendar_id: calendarId,
    } as Participant;

    it('[성공] 닉네임과 비밀번호 일치 시 로그인에 성공해야 한다', async () => {
      mockParticipantRepository.findByCalendarAndNickname.mockResolvedValue(participant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      const result = await participantService.loginParticipant(calendarId, nickname, password);

      expect(mockParticipantRepository.findByCalendarAndNickname).toHaveBeenCalledWith(
        calendarId,
        nickname
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result.participant).toEqual(participant);
      expect(result.participantUuid).toBe(participant.participant_uuid);
    });

    it('[실패] 비밀번호 불일치 시 Unauthorized 에러를 던져야 한다', async () => {
      mockParticipantRepository.findByCalendarAndNickname.mockResolvedValue(participant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never); // 불일치

      await expect(
        participantService.loginParticipant(calendarId, nickname, password)
      ).rejects.toThrow('닉네임 또는 비밀번호가 일치하지 않습니다');
    });

    it('[실패] 존재하지 않는 닉네임 조회 시 Unauthorized 에러를 던져야 한다', async () => {
      mockParticipantRepository.findByCalendarAndNickname.mockResolvedValue(null);

      await expect(
        participantService.loginParticipant(calendarId, 'Unknown', password)
      ).rejects.toThrow('닉네임 또는 비밀번호가 일치하지 않습니다');
    });
  });

  // =================================================================
  // 3. 참가자 삭제 (deleteParticipant)
  // =================================================================
  describe('deleteParticipant', () => {
    const calendarId = 1;
    const participantId = 10;
    const participant = {
      id: participantId,
      calendar_id: calendarId,
      nickname: 'TargetUser',
    } as Participant;

    it('[성공] 정상적인 삭제 요청 시 Repository의 delete가 호출되어야 한다', async () => {
      mockParticipantRepository.findById.mockResolvedValue(participant);
      mockParticipantRepository.delete.mockResolvedValue(true);

      await participantService.deleteParticipant(participantId, calendarId);

      expect(mockParticipantRepository.delete).toHaveBeenCalledWith(participantId);
    });

    it('[실패] 요청한 캘린더 ID와 참가자의 캘린더 ID가 다를 경우 Forbidden 에러를 던져야 한다', async () => {
      const otherCalendarId = 999;
      mockParticipantRepository.findById.mockResolvedValue(participant); // participant.calendar_id = 1

      await expect(
        participantService.deleteParticipant(participantId, otherCalendarId)
      ).rejects.toThrow('삭제 권한이 없습니다');

      expect(mockParticipantRepository.delete).not.toHaveBeenCalled();
    });

    it('[실패] 존재하지 않는 참가자 삭제 시 NotFound 에러를 던져야 한다', async () => {
      mockParticipantRepository.findById.mockResolvedValue(null);

      await expect(participantService.deleteParticipant(participantId, calendarId)).rejects.toThrow(
        '참가자를 찾을 수 없습니다'
      );
    });

    it('[실패] DB 삭제 작업 실패 시 Internal 에러를 던져야 한다', async () => {
      mockParticipantRepository.findById.mockResolvedValue(participant);
      mockParticipantRepository.delete.mockResolvedValue(false);

      await expect(participantService.deleteParticipant(participantId, calendarId)).rejects.toThrow(
        '참가자 삭제에 실패했습니다'
      );
    });
  });

  describe('로그인 후 게스트 참여 정보 정리', () => {
    const guest = {
      id: 11,
      participant_uuid: 'guest-uuid',
      calendar_id: 1,
      user_id: null,
      role: 'guest',
      profile_type: 'password',
      nickname: '게스트별명',
    } as Participant;
    const accountParticipant = {
      id: 12,
      participant_uuid: 'account-uuid',
      calendar_id: 1,
      user_id: 7,
      role: 'host',
      profile_type: 'account',
      nickname: '계정이름',
    } as Participant;

    beforeEach(() => {
      mockParticipantRepository.findByUuidForUpdate.mockResolvedValue(guest);
      mockParticipantRepository.delete.mockResolvedValue(true);
      mockParticipantRepository.nicknameExistsExcluding.mockResolvedValue(false);
      mockVoteRepository.findAllByParticipant.mockResolvedValue([]);
    });

    it('방장 계정 기록을 선택하면 게스트만 삭제한다', async () => {
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(accountParticipant);

      const result = await participantService.reconcileParticipant({
        calendarId: 1,
        userId: 7,
        accountNickname: '계정이름',
        guestParticipantUuid: guest.participant_uuid,
        action: 'keep-account',
      });

      expect(mockVoteRepository.replaceVotesFromParticipant).not.toHaveBeenCalled();
      expect(mockParticipantRepository.delete).toHaveBeenCalledWith(guest.id, expect.anything());
      expect(result.participant).toBe(accountParticipant);
    });

    it('게스트 기록을 선택하면 계정 참가자의 투표 전체를 교체한다', async () => {
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(accountParticipant);

      await participantService.reconcileParticipant({
        calendarId: 1,
        userId: 7,
        accountNickname: '계정이름',
        guestParticipantUuid: guest.participant_uuid,
        action: 'use-guest-votes',
      });

      expect(mockVoteRepository.replaceVotesFromParticipant).toHaveBeenCalledWith(
        accountParticipant.id,
        guest.id,
        expect.anything()
      );
      expect(mockParticipantRepository.delete).toHaveBeenCalledWith(guest.id, expect.anything());
    });

    it.each(['keep-account', 'use-guest-votes'] as const)(
      '마감 후 %s 선택은 투표와 참가자를 변경하지 않는다',
      async (action) => {
        mockCalendarRepository.findByIdForUpdate.mockResolvedValue({
          id: 1,
          is_closed: true,
          vote_start_date: '2000-01-01',
          vote_end_date: '2099-12-31',
        } as Calendar);
        mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(accountParticipant);

        await expect(
          participantService.reconcileParticipant({
            calendarId: 1,
            userId: 7,
            accountNickname: '계정이름',
            guestParticipantUuid: guest.participant_uuid,
            action,
          })
        ).rejects.toThrow('마감되거나 투표 기간이 끝난 캘린더의 투표 기록은 변경할 수 없습니다');

        expect(mockVoteRepository.replaceVotesFromParticipant).not.toHaveBeenCalled();
        expect(mockParticipantRepository.delete).not.toHaveBeenCalled();
      }
    );

    it('투표 종료일이 지난 뒤에는 기록 통합을 차단한다', async () => {
      mockCalendarRepository.findByIdForUpdate.mockResolvedValue({
        id: 1,
        is_closed: false,
        vote_start_date: '2000-01-01',
        vote_end_date: '2000-01-02',
      } as Calendar);
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(accountParticipant);

      await expect(
        participantService.reconcileParticipant({
          calendarId: 1,
          userId: 7,
          accountNickname: '계정이름',
          guestParticipantUuid: guest.participant_uuid,
          action: 'keep-account',
        })
      ).rejects.toThrow('마감되거나 투표 기간이 끝난 캘린더의 투표 기록은 변경할 수 없습니다');

      expect(mockParticipantRepository.delete).not.toHaveBeenCalled();
    });

    it('기존 계정 참가자가 없으면 게스트 행을 계정 프로필로 연결한다', async () => {
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(null);
      (randomUUID as jest.Mock).mockReturnValue('rotated-uuid');
      mockParticipantRepository.claimAnonymousParticipant.mockResolvedValue({
        ...guest,
        participant_uuid: 'rotated-uuid',
        user_id: 7,
        profile_type: 'account',
        nickname: '계정이름',
        password_hash: null,
      });

      const result = await participantService.reconcileParticipant({
        calendarId: 1,
        userId: 7,
        accountNickname: '계정이름',
        guestParticipantUuid: guest.participant_uuid,
        action: 'claim-account',
      });

      expect(mockParticipantRepository.claimAnonymousParticipant).toHaveBeenCalledWith(
        guest.id,
        expect.objectContaining({
          participantUuid: 'rotated-uuid',
          userId: 7,
          nickname: '계정이름',
          profileType: 'account',
        }),
        expect.anything()
      );
      expect(result.removedGuestUuid).toBe('guest-uuid');
    });

    it('마감 후에도 투표를 바꾸지 않는 계정 연결은 허용한다', async () => {
      mockCalendarRepository.findByIdForUpdate.mockResolvedValue({
        id: 1,
        is_closed: true,
        vote_start_date: '2000-01-01',
        vote_end_date: '2000-01-02',
      } as Calendar);
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(null);
      mockParticipantRepository.claimAnonymousParticipant.mockResolvedValue({
        ...guest,
        participant_uuid: 'rotated-uuid',
        user_id: 7,
        profile_type: 'alias',
        password_hash: null,
      });

      await participantService.reconcileParticipant({
        calendarId: 1,
        userId: 7,
        accountNickname: '계정이름',
        guestParticipantUuid: guest.participant_uuid,
        action: 'claim-alias',
      });

      expect(mockParticipantRepository.claimAnonymousParticipant).toHaveBeenCalled();
      expect(mockParticipantRepository.delete).not.toHaveBeenCalled();
    });

    it('별명 연결을 선택하면 기존 별명과 투표를 유지한다', async () => {
      mockParticipantRepository.findUserParticipantForUpdate.mockResolvedValue(null);
      mockParticipantRepository.claimAnonymousParticipant.mockResolvedValue({
        ...guest,
        participant_uuid: 'rotated-uuid',
        user_id: 7,
        profile_type: 'alias',
        password_hash: null,
      });

      await participantService.reconcileParticipant({
        calendarId: 1,
        userId: 7,
        accountNickname: '계정이름',
        guestParticipantUuid: guest.participant_uuid,
        action: 'claim-alias',
      });

      expect(mockParticipantRepository.claimAnonymousParticipant).toHaveBeenCalledWith(
        guest.id,
        expect.objectContaining({ nickname: '게스트별명', profileType: 'alias' }),
        expect.anything()
      );
      expect(mockVoteRepository.replaceVotesFromParticipant).not.toHaveBeenCalled();
    });
  });
});
