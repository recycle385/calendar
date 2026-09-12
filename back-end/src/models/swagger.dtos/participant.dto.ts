import { DefaultResponseDto } from './common.dto';

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterParticipantRequest:
 *       type: object
 *       required:
 *         - nickname
 *       properties:
 *         nickname:
 *           type: string
 *           minLength: 1
 *           maxLength: 20
 *           example: "민수"
 *         password:
 *           type: string
 *           format: password
 *           writeOnly: true
 *           minLength: 4
 *           maxLength: 50
 *           example: "1234"
 */
export interface RegisterParticipantRequest {
  nickname: string;
  password?: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginParticipantRequest:
 *       type: object
 *       properties:
 *         nickname:
 *           type: string
 *           description: 회원 인증 시 생략할 수 있으며, 게스트 로그인 시 필요합니다.
 *           example: "민수"
 *         password:
 *           type: string
 *           format: password
 *           writeOnly: true
 *           description: 게스트 로그인 시 필요합니다.
 *           example: "1234"
 */
export interface LoginParticipantRequest {
  nickname?: string;
  password?: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CommonParticipant:
 *       type: object
 *       required: [uuid, nickname, color_code, joined_at]
 *       properties:
 *         uuid:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         nickname:
 *           type: string
 *           example: "민수"
 *         color_code:
 *           type: string
 *           pattern: "^#[0-9A-Fa-f]{6}$"
 *           example: "#FF0000"
 *         joined_at:
 *           type: string
 *           format: date-time
 */
export interface CommonParticipant {
  uuid: string;
  nickname: string;
  color_code: string;
  joined_at: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     DefaultParticipantDoc:
 *       allOf:
 *         - $ref: "#/components/schemas/CommonParticipant"
 *         - type: object
 *           properties:
 *             vote_count:
 *               type: integer
 *             total_dates:
 *               type: integer
 *             vote_rate:
 *               type: number
 *           required: [vote_count, total_dates, vote_rate]
 */
export interface DefaultParticipantDoc extends CommonParticipant {
  vote_count: number;
  total_dates: number;
  vote_rate: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ParticipantForRegister:
 *       allOf:
 *         - $ref: '#/components/schemas/CommonParticipant'
 *         - type: object
 *           properties:
 *             role:
 *               type: string
 *               enum: [host, guest]
 *               example: "host"
 *           required: [role]
 */
export interface ParticipantForRegister extends CommonParticipant {
  role: 'host' | 'guest';
}

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterParticipantResponse:
 *       allOf:
 *         - $ref: "#/components/schemas/DefaultResponseDto"
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "참가자 등록이 완료되었습니다"
 *             participant:
 *               $ref: "#/components/schemas/ParticipantForRegister"
 *             participantToken:
 *               type: string
 *               description: 해당 캘린더의 참가자 인증에 사용하는 JWT
 *           required: [participant, participantToken]
 */
export interface RegisterParticipantResponse extends DefaultResponseDto {
  participant: ParticipantForRegister;
  participantToken: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginParticipantResponse:
 *       allOf:
 *         - $ref: "#/components/schemas/DefaultResponseDto"
 *         - type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "로그인 성공"
 *             participant:
 *               $ref: "#/components/schemas/CommonParticipant"
 *             participantToken:
 *               type: string
 *               description: 해당 캘린더의 참가자 인증에 사용하는 JWT
 *           required: [participant, participantToken]
 */
export interface LoginParticipantResponse extends DefaultResponseDto {
  participant: CommonParticipant;
  participantToken: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     GetParticipantsResponse:
 *       type: object
 *       required: [participants, count]
 *       properties:
 *         participants:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/DefaultParticipantDoc"
 *         count:
 *           type: integer
 */
export interface GetParticipantsResponse {
  participants: DefaultParticipantDoc[];
  count: number;
}
