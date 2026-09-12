import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MOIM',
      description: 'Google OAuth 기반 모임 캘린더 API',
      version: '1.0.0',
    },

    tags: [
      { name: 'Auth', description: 'Google OAuth 및 토큰 인증' },
      { name: 'Calendar', description: '캘린더 관리' },
      { name: 'Participants', description: '캘린더 참가자 관리' },
      { name: 'Votes', description: '날짜별 투표' },
      { name: 'DateInfo', description: '공휴일 및 기념일 정보' },
    ],

    components: {
      securitySchemes: {
        UserAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ParticipantAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        OperatorAuth: {
          type: 'http',
          scheme: 'bearer',
          description:
            'HOST_ACCESS_TOKEN 운영자 토큰. Authorization: Bearer <token> 형식으로 전달합니다.',
        },
        RefreshTokenCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
          description: '로그인 시 서버가 설정하는 HttpOnly refresh token 쿠키',
        },
      },
    },
  },
  apis: ['src/routes/*.ts', 'src/models/swagger.dtos/*.ts'],
};

export const swaggerSets = swaggerJSDoc(options);
