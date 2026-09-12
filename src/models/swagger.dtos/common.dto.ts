/**
 * @swagger
 * components:
 *   schemas:
 *     DefaultResponseDto:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: "성공적으로 처리되었습니다."
 *     ErrorResponse:
 *       type: object
 *       required: [success, message]
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "잘못된 요청입니다."
 *         code:
 *           type: string
 *           description: 애플리케이션 오류 코드
 *           example: "VALIDATION_ERROR"
 *         details:
 *           description: 검증 실패 등 오류에 포함될 수 있는 추가 정보
 *         stack:
 *           type: string
 *           description: 개발 환경에서만 반환될 수 있는 오류 스택
 */
export interface DefaultResponseDto {
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}
