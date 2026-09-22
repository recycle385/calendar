import axios from 'axios';

import { env } from '../config/env';
import { logger } from '../middlewares/logger';
import { Calendar } from '../models/Calendar';
import { DateVoteStatus } from '../models/Vote';
import { renderCalendarClosedEmail } from '../templates/calendarClosedEmail';

interface SendCalendarClosedEmailInput {
  to: string;
  calendar: Calendar;
  voteStatus: DateVoteStatus[];
  participantsCount: number;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

export class MailService {
  public isConfigured(): boolean {
    return Boolean(
      env.GMAIL_CLIENT_ID &&
        env.GMAIL_CLIENT_SECRET &&
        env.GMAIL_REFRESH_TOKEN &&
        env.GMAIL_SENDER_EMAIL
    );
  }

  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gmail API 환경변수가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID!,
      client_secret: env.GMAIL_CLIENT_SECRET!,
      refresh_token: env.GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    });

    const { data } = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    return data.access_token;
  }

  public async sendCalendarClosedEmail({
    to,
    calendar,
    voteStatus,
    participantsCount,
  }: SendCalendarClosedEmailInput): Promise<void> {
    if (!this.isConfigured()) {
      logger.warn(
        `[Mail] Gmail API 설정이 없어 마감 메일 발송을 건너뜁니다. calendar=${calendar.slug}`
      );
      return;
    }

    const subject = `[모임] ${calendar.title} 투표가 마감되었습니다.`;

    const html = renderCalendarClosedEmail({
      calendar,
      voteStatus,
      participantsCount,
      ctaUrl: env.CLIENT_URL,
    });

    const text = [
      `${calendar.title} 투표가 마감되었습니다.`,
      '',
      `참여자 ${participantsCount}명의 투표 결과를 확인해보세요.`,
      '',
      `모임 확인하기: ${env.CLIENT_URL}`,
    ].join('\r\n');

    const boundary = `moim_${Date.now()}`;

    const rawMessage = [
      `From: ${encodeHeader('모임')} <${env.GMAIL_SENDER_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const accessToken = await this.getAccessToken();

    await axios.post(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      { raw: encodeBase64Url(rawMessage) },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    logger.info(`[Mail] 투표 마감 메일 발송 완료: ${calendar.slug} -> ${to}`);
  }
}
