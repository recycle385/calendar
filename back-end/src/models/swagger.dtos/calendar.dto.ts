import { DefaultResponseDto } from './common.dto';

/**
 * @swagger
 * components:
 *   schemas:
 *     SafeCalendarDto:
 *       type: object
 *       required:
 *         [
 *           slug,
 *           title,
 *           start_date,
 *           end_date,
 *           vote_start_date,
 *           vote_end_date,
 *           is_closed,
 *           hostParticipantUuid,
 *           created_at,
 *           updated_at,
 *           expired_at,
 *         ]
 *       properties:
 *         slug:
 *           type: string
 *           pattern: "^[a-f0-9]{16}$"
 *           description: 16자리 소문자 hexadecimal slug
 *           example: "a1b2c3d4e5f60718"
 *         title:
 *           type: string
 *           example: "스터디 모임"
 *         description:
 *           type: string
 *           nullable: true
 *           example: null
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2026-09-10"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2026-09-20"
 *         vote_start_date:
 *           type: string
 *           format: date
 *           example: "2026-09-01"
 *         vote_end_date:
 *           type: string
 *           format: date
 *           example: "2026-09-08"
 *         is_closed:
 *           type: boolean
 *           example: false
 *         hostParticipantUuid:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-02-01T12:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-02-02T09:00:00Z"
 *         expired_at:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T12:00:00Z"
 *         participant_count:
 *           type: integer
 *           description: 내 캘린더 목록 응답에 포함되는 현재 참가자 수
 *           example: 5
 */
export interface SafeCalendarDto {
  slug: string; // 랜덤 16자리 hexadecimal 토큰
  title: string;
  description: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  vote_start_date: string; // YYYY-MM-DD
  vote_end_date: string; // YYYY-MM-DD
  is_closed: boolean; // 투표 마감 여부
  hostParticipantUuid: string; // useruuid가 아니라 participantuuid 넣어야함 (safe 응답용)
  created_at: Date;
  updated_at: Date;
  expired_at: Date;
  participant_count?: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCalendarRequest:
 *       type: object
 *       required: [title, start_date, end_date, vote_start_date, vote_end_date, hostNickname]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: "팀 프로젝트 회의"
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2026-02-15"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2026-02-28"
 *         vote_start_date:
 *           type: string
 *           format: date
 *           example: "2026-02-01"
 *         vote_end_date:
 *           type: string
 *           format: date
 *           example: "2026-02-10"
 *         description:
 *           type: string
 *           example: "팀 프로젝트 회의 입니다."
 *           nullable: true
 *         hostNickname:
 *           type: string
 *           minLength: 1
 *           maxLength: 20
 *           example: "방장"
 */
export interface CreateCalendarRequest {
  title: string;
  start_date: string; //YYYY-MM-DD
  end_date: string; //YYYY-MM-DD
  vote_start_date: string; //YYYY-MM-DD
  vote_end_date: string; //YYYY-MM-DD
  description?: string | null;
  hostNickname: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateCalendarRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: "팀 프로젝트 회의"
 *         description:
 *           type: string
 *           example: "팀 프로젝트 회의 입니다."
 *           nullable: true
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2026-02-15"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2026-02-28"
 *         vote_start_date:
 *           type: string
 *           format: date
 *         vote_end_date:
 *           type: string
 *           format: date
 */
export interface UpdateCalendarRequest {
  title?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  vote_start_date?: string;
  vote_end_date?: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCalendarResponse:
 *       allOf:
 *         - $ref: "#/components/schemas/DefaultResponseDto"
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *             calendar:
 *               $ref: "#/components/schemas/SafeCalendarDto"
 *             shareUrl:
 *               type: string
 *               format: uri
 *             participantToken:
 *               type: string
 *               description: 특정 캘린더에서 회원/비회원 구분 없이 참여자를 식별하고 권한을 제어하는 JWT 토큰
 *           required: [calendar, shareUrl, participantToken]
 */
export interface CreateCalendarResponse extends DefaultResponseDto {
  calendar: SafeCalendarDto;
  shareUrl: string;
  participantToken: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     GetMyCalendarsResponse:
 *       type: object
 *       required: [calendars, count]
 *       properties:
 *         calendars:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/SafeCalendarDto"
 *         count:
 *           type: integer
 */
export interface GetMyCalendarsResponse {
  calendars: SafeCalendarDto[];
  count: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CommonCalendarResponse:
 *       allOf:
 *         - $ref: "#/components/schemas/DefaultResponseDto"
 *         - type: object
 *           properties:
 *             calendar:
 *               $ref: "#/components/schemas/SafeCalendarDto"
 *           required: [calendar]
 */
export interface CommonCalendarResponse extends DefaultResponseDto {
  calendar: SafeCalendarDto;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CalendarForVoteStatus:
 *       type: object
 *       required: [slug, title, start_date, end_date, is_closed]
 *       properties:
 *         slug:
 *           type: string
 *           pattern: "^[a-f0-9]{16}$"
 *           example: "a1b2c3d4e5f60718"
 *         title:
 *           type: string
 *           example: "ㅇㄹ"
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         is_closed:
 *           type: boolean
 *           example: false
 */
export interface CalendarForVoteStatus {
  slug: string;
  title: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}
