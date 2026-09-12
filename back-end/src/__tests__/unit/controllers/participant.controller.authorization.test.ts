import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { env } from '../../../config/env';
import { CalendarController } from '../../../controllers/calendar.controller';
import { ParticipantController } from '../../../controllers/participant.controller';
import { errorHandler } from '../../../middlewares/errorHandler';
import { createCalendarRouter } from '../../../routes/calendar.routes';
import { createParticipantRouter } from '../../../routes/participant.routes';
import { CalendarService } from '../../../services/calendar.service';
import { participantSocketRoom } from '../../../sockets/socketRooms';
import { generateMainToken } from '../../../utils/jwt/mainToken';
import { generateParticipantToken } from '../../../utils/jwt/participantToken';

const mockDisconnectSockets = jest.fn();
const mockIoIn = jest.fn(() => ({
  disconnectSockets: mockDisconnectSockets,
  fetchSockets: async () => [],
}));

jest.mock('../../../containers/service.container', () => ({
  tokenService: {
    verifyMainToken: (token: string) =>
      jest.requireActual('../../../utils/jwt/mainToken').verifyMainToken(token),
    verifyParticipantToken: (token: string) =>
      jest.requireActual('../../../utils/jwt/participantToken').verifyParticipantToken(token),
  },
}));
jest.mock('../../../infrastructure/transaction.manager', () => ({
  TransactionManager: { run: (fn: (con: object) => unknown) => fn({}) },
}));
jest.mock('../../../sockets', () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
    in: mockIoIn,
  }),
}));

const slug = 'calendar1234';
const targetUuid = '11111111-1111-4111-8111-111111111111';
const operations = [
  ['patch', `/calendars/${slug}`, { title: '수정 제목' }],
  ['delete', `/calendars/${slug}`, {}],
  ['post', `/calendars/${slug}/close`, {}],
  ['delete', `/calendars/${slug}/participants/${targetUuid}`, {}],
] as const;

describe('관리 API는 Main Token과 DB 소유권으로 인가한다', () => {
  const calendar = {
    id: 10,
    slug,
    owner_id: 1,
    is_closed: false,
    start_date: '2026-09-01',
    end_date: '2026-09-30',
  };
  const repository = {
    findBySlug: jest.fn(),
    findBySlugForUpdate: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    close: jest.fn(),
  };
  const participants = {
    getParticipantUuidByUserIdAndCalendarId: jest.fn(),
    getParticipantByUuid: jest.fn(),
    deleteParticipant: jest.fn(),
  };
  const users = { getIdUsingUuid: jest.fn() };
  let app: express.Express;
  const legacySecret = env.LEGACY_JWT_SECRET;

  beforeEach(() => {
    jest.resetAllMocks();
    mockIoIn.mockImplementation(() => ({
      disconnectSockets: mockDisconnectSockets,
      fetchSockets: async () => [],
    }));
    repository.findBySlug.mockResolvedValue(calendar);
    repository.findBySlugForUpdate.mockResolvedValue(calendar);
    repository.findById.mockResolvedValue(calendar);
    repository.update.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);
    repository.close.mockResolvedValue(true);
    participants.getParticipantUuidByUserIdAndCalendarId.mockResolvedValue('host-participant');
    participants.getParticipantByUuid.mockResolvedValue({
      id: 20,
      calendar_id: 10,
      role: 'guest',
      user_id: 2,
    });
    users.getIdUsingUuid.mockImplementation(async (uuid: string) => (uuid === 'owner' ? 1 : 2));
    const calendars = new CalendarService(repository as never, {} as never, {} as never);
    app = express();
    app.use(express.json());
    app.use(
      '/calendars',
      createCalendarRouter(
        new CalendarController(calendars, users as never, participants as never, {} as never)
      )
    );
    app.use(
      '/calendars/:slug/participants',
      createParticipantRouter(
        new ParticipantController(participants as never, calendars, users as never, {} as never)
      )
    );
    app.use(errorHandler);
  });
  afterEach(() => {
    env.LEGACY_JWT_SECRET = legacySecret;
  });

  it.each(operations)('%s %s는 소유자의 Main Token만으로 성공한다', async (method, path, body) => {
    await request(app)
      [method](path)
      .set('Authorization', `Bearer ${generateMainToken({ sub: 'owner' })}`)
      .send(body)
      .expect(200);
  });

  it.each(operations)('%s %s는 다른 회원의 Main Token을 거부한다', async (method, path, body) => {
    await request(app)
      [method](path)
      .set('Authorization', `Bearer ${generateMainToken({ sub: 'other' })}`)
      .send(body)
      .expect(403);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.close).not.toHaveBeenCalled();
    expect(participants.deleteParticipant).not.toHaveBeenCalled();
  });

  it.each(operations)('%s %s는 host Participant Token도 거부한다', async (method, path, body) => {
    const token = generateParticipantToken({
      sub: 'owner',
      nickname: 'host',
      role: 'host',
      userUuid: 'owner',
      calendarSlug: slug,
    });
    await request(app)[method](path).set('Authorization', `Bearer ${token}`).send(body).expect(401);
    expect(users.getIdUsingUuid).not.toHaveBeenCalled();
  });

  it.each(operations)('%s %s는 인증 없는 요청을 거부한다', async (method, path, body) => {
    await request(app)[method](path).send(body).expect(401);
  });

  it.each(['calendarSlug', 'calendarId', 'tokenId'])(
    '공용 키로 서명된 %s 토큰도 Main Token으로 사용하지 못한다',
    async (field) => {
      env.LEGACY_JWT_SECRET = 'legacy-test-secret';
      const token = jwt.sign({ sub: 'owner', role: 'host', [field]: slug }, env.LEGACY_JWT_SECRET);
      await request(app)
        .delete(`/calendars/${slug}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    }
  );

  it('빈 수정 요청도 DB 소유권 검사를 생략하지 않는다', async () => {
    await request(app)
      .patch(`/calendars/${slug}`)
      .set('Authorization', `Bearer ${generateMainToken({ sub: 'other' })}`)
      .send({})
      .expect(403);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    { calendar_id: 99, role: 'guest', user_id: 2 },
    { calendar_id: 10, role: 'host', user_id: 1 },
  ])('소유자도 다른 캘린더 참가자나 방장을 강퇴할 수 없다: %p', async (target) => {
    participants.getParticipantByUuid.mockResolvedValue({ id: 20, ...target });
    const response = await request(app)
      .delete(`/calendars/${slug}/participants/${targetUuid}`)
      .set('Authorization', `Bearer ${generateMainToken({ sub: 'owner' })}`);
    expect([400, 403]).toContain(response.status);
    expect(participants.deleteParticipant).not.toHaveBeenCalled();
  });

  it('강퇴 시 캘린더 방 밖 연결까지 포함하는 참가자 전용 룸을 종료한다', async () => {
    await request(app)
      .delete(`/calendars/${slug}/participants/${targetUuid}`)
      .set('Authorization', `Bearer ${generateMainToken({ sub: 'owner' })}`)
      .expect(200);

    expect(mockIoIn).toHaveBeenCalledWith(participantSocketRoom(targetUuid));
    expect(mockDisconnectSockets).toHaveBeenCalledWith(true);
  });
});
