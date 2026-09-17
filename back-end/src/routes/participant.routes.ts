import { RequestHandler, Router } from 'express';

import { env } from '../config/env';
import { PARTICIPANT_ROUTES } from '../constants/routes.constants';
import { ParticipantController } from '../controllers/participant.controller';
import {
  authRateLimiter,
  guestEntryAuthRateLimiter,
  guestEntryRegistrationRateLimiter,
  optionalAuth,
} from '../middlewares';
import {
  authenticateGuestParticipant,
  authenticateParticipant,
  authenticateUser,
} from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import {
  commonSchemas,
  participantSchemas,
  slugParams,
  validateBody,
  validateParams,
} from '../middlewares/validation';

const applyGuestEntryRateLimit: RequestHandler = (req, res, next) =>
  (res.locals.guestParticipantExists
    ? guestEntryAuthRateLimiter
    : guestEntryRegistrationRateLimiter)(req, res, next);

export const createParticipantRouter = (controller: ParticipantController): Router => {
  const router = Router({ mergeParams: true });

  /**
   * @swagger
   * /api/v1/calendars/{slug}/participants:
   *   post:
   *     summary: 참가자 등록 (회원가입)
   *     description: "회원은 닉네임만, 비회원(게스트)은 닉네임과 비밀번호가 필요합니다. 마감된 캘린더는 참가할 수 없습니다."
   *     security:
   *       - UserAuth: []
   *       - {}
   *     tags: [Participants]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         description: "16자리 소문자 hexadecimal 캘린더 식별 slug"
   *         schema:
   *           type: string
   *           pattern: "^[a-f0-9]{16}$"
   *           example: "a1b2c3d4e5f60718"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/RegisterParticipantRequest"
   *     responses:
   *       201:
   *         description: 참가자 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/RegisterParticipantResponse"
   *       400:
   *         description: "잘못된 요청 (이미 마감된 캘린더거나 필수 파라미터 누락)"
   *       401:
   *         description: 선택한 사용자 토큰이 유효하지 않습니다.
   *       404:
   *         description: 캘린더를 찾을 수 없습니다.
   *       409:
   *         description: 이미 참여했거나 닉네임이 이미 사용 중입니다.
   */
  router.post(
    '/',
    validateParams(slugParams),
    validateBody(participantSchemas.registerRequest),
    optionalAuth,
    asyncHandler(controller.registerParticipant)
  );

  router.post(
    PARTICIPANT_ROUTES.GUEST_ENTRY,
    validateParams(slugParams),
    validateBody(participantSchemas.guestEntryRequest),
    ...(env.ENABLE_RATE_LIMIT
      ? [
          asyncHandler(controller.classifyGuestEntry),
          applyGuestEntryRateLimit,
        ]
      : []),
    asyncHandler(controller.enterGuestParticipant)
  );

  /**
   * 로그인 전 사용하던 익명 게스트 참여 정보와 현재 계정의 참여 정보를 비교합니다.
   * Main 토큰은 Authorization, 게스트 참가자 토큰은 X-Participant-Token으로 전달합니다.
   */
  router.get(
    PARTICIPANT_ROUTES.RECONCILIATION,
    validateParams(slugParams),
    authenticateUser,
    authenticateGuestParticipant,
    asyncHandler(controller.previewReconciliation)
  );

  /**
   * 사용자가 선택한 방식으로 계정/게스트 투표 기록을 하나로 정리합니다.
   */
  router.post(
    PARTICIPANT_ROUTES.RECONCILIATION,
    validateParams(slugParams),
    validateBody(participantSchemas.reconciliationRequest),
    authenticateUser,
    authenticateGuestParticipant,
    asyncHandler(controller.reconcileParticipant)
  );

  /**
   * @swagger
   * /api/v1/calendars/{slug}/participants/login:
   *   post:
   *     summary: 참가자 로그인
   *     description: "비회원은 닉네임과 비밀번호로 로그인하며, 회원은 본인 계정 정보로 자동 매칭됩니다."
   *     security:
   *       - UserAuth: []
   *       - {}
   *     tags: [Participants]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         description: "16자리 소문자 hexadecimal 캘린더 식별 slug"
   *         schema:
   *           type: string
   *           pattern: "^[a-f0-9]{16}$"
   *           example: "a1b2c3d4e5f60718"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/LoginParticipantRequest"
   *     responses:
   *       200:
   *         description: 로그인 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LoginParticipantResponse"
   *       400:
   *         description: "닉네임/비밀번호 누락 또는 잘못된 정보"
   *       401:
   *         description: 참가자 인증 정보가 없거나 닉네임/비밀번호가 일치하지 않습니다.
   *       404:
   *         description: "존재하지 않는 캘린더"
   */
  router.post(
    PARTICIPANT_ROUTES.LOGIN,
    validateParams(slugParams),
    ...(env.ENABLE_RATE_LIMIT ? [authRateLimiter] : []),
    validateBody(participantSchemas.loginRequest),
    optionalAuth,
    asyncHandler(controller.loginParticipant)
  );

  /**
   * @swagger
   * /api/v1/calendars/{slug}/participants:
   *   get:
   *     summary: 캘린더의 모든 참가자 조회 (투표 현황 포함)
   *     description: "해당 캘린더에 참여 중인 모든 유저의 목록과 각자의 투표 통계를 반환합니다."
   *     tags: [Participants]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         description: "16자리 소문자 hexadecimal 캘린더 식별 slug"
   *         schema:
   *           type: string
   *           pattern: "^[a-f0-9]{16}$"
   *           example: "a1b2c3d4e5f60718"
   *     responses:
   *       200:
   *         description: 참가자 목록 조회 완료
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/GetParticipantsResponse"
   *       404:
   *         description: "존재하지 않는 캘린더"
   */
  router.get('/', validateParams(slugParams), asyncHandler(controller.getParticipants));

  /**
   * @swagger
   * /api/v1/calendars/{slug}/participants/self:
   *   delete:
   *     summary: 참가자 삭제 (스스로)
   *     description: 본인만 가능, 토큰 필요
   *     security:
   *       - ParticipantAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         description: "16자리 소문자 hexadecimal 캘린더 식별 slug"
   *         schema:
   *           type: string
   *           pattern: "^[a-f0-9]{16}$"
   *           example: "a1b2c3d4e5f60718"
   *     tags: [Participants]
   *     responses:
   *       200:
   *         description: 참가자 삭제 완료
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DefaultResponseDto"
   *       400:
   *         description: 방장은 참가자 자기 삭제를 할 수 없습니다.
   *       401:
   *         description: 참가자 인증이 필요하거나 토큰이 유효하지 않습니다.
   *       404:
   *         description: 캘린더 또는 참가자를 찾을 수 없습니다.
   */
  router.delete(
    PARTICIPANT_ROUTES.DELETE_SELF,
    validateParams(slugParams),
    authenticateParticipant,
    asyncHandler(controller.deleteParticipantSelf)
  );

  /**
   * @swagger
   * /api/v1/calendars/{slug}/participants/{participantUuid}:
   *   delete:
   *     summary: 방장의 유저 강퇴
   *     description: 방장만 가능
   *     security:
   *       - UserAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         description: "16자리 소문자 hexadecimal 캘린더 식별 slug"
   *         schema:
   *           type: string
   *           pattern: "^[a-f0-9]{16}$"
   *           example: "a1b2c3d4e5f60718"
   *       - in: path
   *         name: participantUuid
   *         required: true
   *         description: "강퇴할 참가자의 UUID"
   *         schema:
   *           type: string
   *           format: uuid
   *     tags: [Participants]
   *     responses:
   *       200:
   *         description: 방장의 유저 강퇴 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DefaultResponseDto"
   *       400:
   *         description: 방장은 강퇴할 수 없습니다.
   *       401:
   *         description: 사용자 인증이 필요하거나 토큰이 유효하지 않습니다.
   *       403:
   *         description: 권한 부족 방장만 가능
   *       404:
   *         description: 캘린더 또는 참가자를 찾을 수 없습니다.
   */
  router.delete(
    PARTICIPANT_ROUTES.DELETE_BY_HOST,
    validateParams(commonSchemas.slugAndParticipantUuidParams),
    authenticateUser,
    asyncHandler(controller.deleteParticipantAsHost)
  );

  return router;
};
