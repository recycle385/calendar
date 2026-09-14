import type { Request, Response } from 'express';

import { CalendarController } from '../../../controllers/calendar.controller';
import type { CalendarWithParticipation } from '../../../models/Calendar';
import type { ICalendarService } from '../../../services/calendar.service';
import type { IParticipantService } from '../../../services/participant.service';
import type { ITokenService } from '../../../services/token.service';
import type { IUserService } from '../../../services/user.service';

describe('참여한 캘린더 목록', () => {
  it('현재 참가자의 역할과 프로필 유형을 안전 응답에 포함한다', async () => {
    const calendar = {
      id: 1,
      slug: 'abcdef1234567890',
      title: '참여 일정',
      description: null,
      start_date: '2026-09-20',
      end_date: '2026-09-21',
      vote_start_date: '2026-09-15',
      vote_end_date: '2026-09-19',
      is_closed: false,
      owner_id: 2,
      created_at: new Date('2026-09-15T00:00:00Z'),
      updated_at: new Date('2026-09-15T00:00:00Z'),
      expired_at: new Date('2026-10-19T00:00:00Z'),
      hostParticipantUuid: 'host-uuid',
      participant_count: 4,
      participantRole: 'guest',
      profileType: 'alias',
      participantUuid: 'alias-uuid',
      participantNickname: '별명',
    } satisfies CalendarWithParticipation;
    const getJoinedCalendars = jest.fn().mockResolvedValue([calendar]);
    const controller = new CalendarController(
      { getJoinedCalendars } as unknown as ICalendarService,
      { getIdUsingUuid: jest.fn().mockResolvedValue(7) } as unknown as IUserService,
      {} as IParticipantService,
      {} as ITokenService
    );
    const req = { userUuid: 'user-uuid' } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await controller.getJoinedCalendars(req, res, jest.fn());

    expect(getJoinedCalendars).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      calendars: [
        expect.objectContaining({
          participantRole: 'guest',
          profileType: 'alias',
          participantUuid: 'alias-uuid',
          participantNickname: '별명',
        }),
      ],
      count: 1,
    });
  });
});
