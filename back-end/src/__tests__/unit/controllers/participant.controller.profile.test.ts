import type { Request, Response } from 'express';

import { ParticipantController } from '../../../controllers/participant.controller';
import type { ICalendarService } from '../../../services/calendar.service';
import type { IParticipantService } from '../../../services/participant.service';
import type { ITokenService } from '../../../services/token.service';
import type { IUserService } from '../../../services/user.service';

describe('로그인 회원의 참여 프로필', () => {
  it('별명 참여를 비밀번호 없이 회원 계정에 연결한다', async () => {
    const registerParticipant = jest.fn().mockResolvedValue({
      participantUuid: 'participant-uuid',
      participant: {
        participant_uuid: 'participant-uuid',
        nickname: '별명',
        color_code: '#FF0000',
        joined_at: new Date('2026-09-15T00:00:00Z'),
        role: 'guest',
      },
    });
    const controller = new ParticipantController(
      { registerParticipant } as unknown as IParticipantService,
      { getCalendarBySlug: jest.fn().mockResolvedValue({ id: 3, is_closed: false }) } as unknown as ICalendarService,
      { getIdUsingUuid: jest.fn().mockResolvedValue(9) } as unknown as IUserService,
      { generateParticipantToken: jest.fn().mockReturnValue('participant-token') } as unknown as ITokenService
    );
    const req = {
      params: { slug: 'abcdef1234567890' },
      body: { nickname: '별명', profileType: 'alias' },
      userUuid: 'user-uuid',
    } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await controller.registerParticipant(req, res, jest.fn());

    expect(registerParticipant).toHaveBeenCalledWith({
      role: 'guest',
      calendarId: 3,
      nickname: '별명',
      userId: 9,
      profileType: 'alias',
    });
  });
});
