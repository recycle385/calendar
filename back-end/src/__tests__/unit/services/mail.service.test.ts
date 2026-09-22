import axios from 'axios';

import { env } from '../../../config/env';
import { Calendar } from '../../../models/Calendar';
import { DateVoteStatus } from '../../../models/Vote';
import { MailService } from '../../../services/mail.service';

jest.mock('axios');
jest.mock('../../../middlewares/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const calendar = {
  id: 1,
  slug: 'mail-service-test',
  title: '메일 테스트',
  description: null,
  start_date: '2026-09-25',
  end_date: '2026-09-27',
  vote_start_date: '2026-09-20',
  vote_end_date: '2026-09-22',
  is_closed: true,
  owner_id: 1,
  created_at: new Date('2026-09-20T00:00:00Z'),
  updated_at: new Date('2026-09-22T00:00:00Z'),
  expired_at: new Date('2026-10-22T00:00:00Z'),
} as Calendar;

const voteStatus: DateVoteStatus[] = [
  {
    date_option_id: 1,
    date_value: '2026-09-26',
    is_enabled: true,
    votes: [
      {
        participant_id: 1,
        participant_nickname: '방장',
        participant_color: '#000000',
        vote_type: 'available',
      },
    ],
  },
];

describe('MailService', () => {
  const original = {
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET,
    refreshToken: env.GMAIL_REFRESH_TOKEN,
    senderEmail: env.GMAIL_SENDER_EMAIL,
  };

  afterEach(() => {
    env.GMAIL_CLIENT_ID = original.clientId;
    env.GMAIL_CLIENT_SECRET = original.clientSecret;
    env.GMAIL_REFRESH_TOKEN = original.refreshToken;
    env.GMAIL_SENDER_EMAIL = original.senderEmail;
    jest.resetAllMocks();
  });

  it('Gmail 설정이 없으면 외부 API를 호출하지 않는다', async () => {
    env.GMAIL_CLIENT_ID = undefined;
    env.GMAIL_CLIENT_SECRET = undefined;
    env.GMAIL_REFRESH_TOKEN = undefined;
    env.GMAIL_SENDER_EMAIL = undefined;

    const service = new MailService();

    await service.sendCalendarClosedEmail({
      to: 'owner@example.com',
      calendar,
      voteStatus,
      participantsCount: 1,
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('refresh token으로 access token을 받은 뒤 Gmail API를 호출한다', async () => {
    env.GMAIL_CLIENT_ID = 'gmail-client-id';
    env.GMAIL_CLIENT_SECRET = 'gmail-client-secret';
    env.GMAIL_REFRESH_TOKEN = 'gmail-refresh-token';
    env.GMAIL_SENDER_EMAIL = 'sender@gmail.com';

    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          access_token: 'access-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/gmail.send',
          token_type: 'Bearer',
        },
      } as never)
      .mockResolvedValueOnce({ data: { id: 'message-id' } } as never);

    const service = new MailService();

    await service.sendCalendarClosedEmail({
      to: 'owner@example.com',
      calendar,
      voteStatus,
      participantsCount: 1,
    });

    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'https://oauth2.googleapis.com/token',
      expect.stringContaining('grant_type=refresh_token'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    );

    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      expect.objectContaining({
        raw: expect.any(String),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      })
    );

    const gmailRequestBody = mockedAxios.post.mock.calls[1][1] as {
      raw: string;
    };

    const decoded = Buffer.from(gmailRequestBody.raw, 'base64url').toString('utf8');

    expect(decoded).toContain('Content-Type: multipart/alternative');
    expect(decoded).toContain('Content-Type: text/plain; charset=UTF-8');
    expect(decoded).toContain('Content-Type: text/html; charset=UTF-8');
  });
});
