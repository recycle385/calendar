import express from 'express';
import request from 'supertest';

import { env } from '../../../config/env';
import { ParticipantController } from '../../../controllers/participant.controller';
import { errorHandler } from '../../../middlewares/errorHandler';
import { createParticipantRouter } from '../../../routes/participant.routes';
import { Errors } from '../../../utils/errors';

describe('게스트 단일 참여 API', () => {
  const slug = 'abcdef1234567890';
  const previousRateLimit = env.ENABLE_RATE_LIMIT;
  const participants = {
    guestParticipantExists: jest.fn(),
    enterGuestParticipant: jest.fn(),
  };
  const calendars = { getCalendarBySlug: jest.fn() };
  const tokens = { generateParticipantToken: jest.fn() };
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    env.ENABLE_RATE_LIMIT = true;
    calendars.getCalendarBySlug.mockResolvedValue({ id: 3, slug });
    participants.guestParticipantExists.mockResolvedValue(false);
    participants.enterGuestParticipant.mockImplementation(
      async (_calendarId: number, nickname: string) => ({
        participant: {
          participant_uuid: `uuid-${nickname}`,
          nickname,
          color_code: '#FF0000',
          joined_at: new Date('2026-09-17T00:00:00Z'),
          role: 'guest',
        },
        participantUuid: `uuid-${nickname}`,
        created: true,
      })
    );
    tokens.generateParticipantToken.mockReturnValue('participant-token');

    app = express();
    app.use(express.json());
    app.use(
      '/calendars/:slug/participants',
      createParticipantRouter(
        new ParticipantController(
          participants as never,
          calendars as never,
          {} as never,
          tokens as never
        )
      )
    );
    app.use(errorHandler);
  });

  afterAll(() => {
    env.ENABLE_RATE_LIMIT = previousRateLimit;
  });

  it('같은 IP에서 서로 다른 신규 게스트 6명이 연속 참여할 수 있다', async () => {
    for (let index = 1; index <= 6; index += 1) {
      await request(app)
        .post(`/calendars/${slug}/participants/guest-entry`)
        .send({ nickname: `신규${index}`, password: '1234' })
        .expect(201);
    }

    expect(participants.enterGuestParticipant).toHaveBeenCalledTimes(6);
  });

  it('기존 참가자의 잘못된 비밀번호만 5회 제한에 누적한다', async () => {
    participants.guestParticipantExists.mockResolvedValue(true);
    participants.enterGuestParticipant.mockRejectedValue(
      Errors.Unauthorized('닉네임 또는 비밀번호가 일치하지 않습니다')
    );

    for (let index = 0; index < 5; index += 1) {
      await request(app)
        .post(`/calendars/${slug}/participants/guest-entry`)
        .send({ nickname: '기존게스트', password: 'wrong' })
        .expect(401);
    }

    const blocked = await request(app)
      .post(`/calendars/${slug}/participants/guest-entry`)
      .send({ nickname: '기존게스트', password: 'wrong' })
      .expect(429);

    expect(blocked.body.code).toBe('GUEST_AUTH_RATE_LIMIT_EXCEEDED');
    expect(participants.enterGuestParticipant).toHaveBeenCalledTimes(5);
  });
});
