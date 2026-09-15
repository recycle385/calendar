import express from 'express';
import request from 'supertest';

import { ParticipantController } from '../../../controllers/participant.controller';
import { errorHandler } from '../../../middlewares/errorHandler';
import { createParticipantRouter } from '../../../routes/participant.routes';
import { generateMainToken } from '../../../utils/jwt/mainToken';
import { generateParticipantToken } from '../../../utils/jwt/participantToken';

const disconnectSockets = jest.fn();
const emit = jest.fn();

jest.mock('../../../containers/service.container', () => ({
  tokenService: {
    verifyMainToken: (token: string) =>
      jest.requireActual('../../../utils/jwt/mainToken').verifyMainToken(token),
    verifyParticipantToken: (token: string) =>
      jest.requireActual('../../../utils/jwt/participantToken').verifyParticipantToken(token),
  },
}));
jest.mock('../../../sockets', () => ({
  getIO: () => ({
    in: () => ({ disconnectSockets }),
    to: () => ({ emit }),
  }),
}));

describe('로그인 후 게스트 참여 정보 정리 API', () => {
  const slug = 'abcdef1234567890';
  const guestUuid = '11111111-1111-4111-8111-111111111111';
  const accountUuid = '22222222-2222-4222-8222-222222222222';
  const mainToken = generateMainToken({ sub: 'user-uuid' });
  const guestToken = generateParticipantToken({
    sub: guestUuid,
    nickname: '게스트별명',
    role: 'guest',
    calendarSlug: slug,
  });
  const participants = {
    previewReconciliation: jest.fn(),
    reconcileParticipant: jest.fn(),
  };
  const calendars = { getCalendarBySlug: jest.fn() };
  const users = { getUserUsingUuid: jest.fn() };
  const tokens = { generateParticipantToken: jest.fn() };
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    calendars.getCalendarBySlug.mockResolvedValue({ id: 3, slug });
    users.getUserUsingUuid.mockResolvedValue({ id: 7, nickname: '계정이름' });
    participants.previewReconciliation.mockResolvedValue({
      state: 'claimable',
      accountNickname: '계정이름',
      guest: { uuid: guestUuid, nickname: '게스트별명', voteCount: 2 },
      accountParticipant: null,
    });
    participants.reconcileParticipant.mockResolvedValue({
      participant: {
        participant_uuid: accountUuid,
        nickname: '계정이름',
        color_code: '#FF0000',
        joined_at: new Date('2026-09-15T00:00:00Z'),
        role: 'guest',
        profile_type: 'account',
      },
      removedGuestUuid: guestUuid,
    });
    tokens.generateParticipantToken.mockReturnValue('new-participant-token');

    app = express();
    app.use(express.json());
    app.use(
      '/calendars/:slug/participants',
      createParticipantRouter(
        new ParticipantController(
          participants as never,
          calendars as never,
          users as never,
          tokens as never
        )
      )
    );
    app.use(errorHandler);
  });

  it('Main 토큰과 익명 게스트 토큰을 함께 검증해 정리 상태를 반환한다', async () => {
    const response = await request(app)
      .get(`/calendars/${slug}/participants/reconciliation`)
      .set('Authorization', `Bearer ${mainToken}`)
      .set('X-Participant-Token', guestToken)
      .expect(200);

    expect(response.body.state).toBe('claimable');
    expect(participants.previewReconciliation).toHaveBeenCalledWith({
      calendarId: 3,
      userId: 7,
      accountNickname: '계정이름',
      guestParticipantUuid: guestUuid,
    });
  });

  it('게스트 토큰이 없으면 요청을 거부한다', async () => {
    await request(app)
      .get(`/calendars/${slug}/participants/reconciliation`)
      .set('Authorization', `Bearer ${mainToken}`)
      .expect(401);
  });

  it('정리 후 새 참가자 토큰을 발급하고 이전 게스트 소켓을 끊는다', async () => {
    const response = await request(app)
      .post(`/calendars/${slug}/participants/reconciliation`)
      .set('Authorization', `Bearer ${mainToken}`)
      .set('X-Participant-Token', guestToken)
      .send({ action: 'claim-account' })
      .expect(200);

    expect(response.body.participantToken).toBe('new-participant-token');
    expect(response.body.participant.uuid).toBe(accountUuid);
    expect(disconnectSockets).toHaveBeenCalledWith(true);
    expect(emit).toHaveBeenCalledWith('participantsUpdated');
  });
});
