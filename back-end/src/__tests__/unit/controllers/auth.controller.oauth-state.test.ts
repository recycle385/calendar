import { describe, expect, it, jest } from '@jest/globals';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';

import { AuthController } from '../../../controllers/auth.controller';
import { asyncHandler, errorHandler } from '../../../middlewares/errorHandler';
import { Errors } from '../../../utils/errors';

type AuthService = ConstructorParameters<typeof AuthController>[0];

function createTestApp(authService: jest.Mocked<AuthService>) {
  const controller = new AuthController(authService);
  const app = express();

  app.use(cookieParser());
  app.get('/google', asyncHandler(controller.redirectToGoogle));
  app.get('/google/callback', asyncHandler(controller.handleGoogleCallback));
  app.post('/refresh', asyncHandler(controller.refreshToken));
  app.use(errorHandler);

  return app;
}

function createMockAuthService(): jest.Mocked<AuthService> {
  return {
    handleGoogleCallback: jest.fn(),
    handleGoogleSignup: jest.fn(),
    refreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };
}

describe('AuthController OAuth state', () => {
  it('Google 인증 URL의 state와 HttpOnly 쿠키 state가 일치해야 한다', async () => {
    const response = await request(createTestApp(createMockAuthService()))
      .get('/google')
      .expect(302);
    const loginUrl = new URL(response.headers.location);
    const setCookies = response.headers['set-cookie'] as unknown as string[];
    const stateCookie = setCookies.find((cookie) => cookie.startsWith('oauth_state='));
    const cookieState = stateCookie?.match(/^oauth_state=([^;]+)/)?.[1];

    expect(cookieState).toBeDefined();
    expect(loginUrl.searchParams.get('state')).toBe(cookieState);
    expect(stateCookie).toContain('HttpOnly');
    expect(stateCookie).toContain('SameSite=Lax');
  });

  it('callback state가 쿠키와 다르면 인증 코드를 교환하지 않는다', async () => {
    const authService = createMockAuthService();

    await request(createTestApp(authService))
      .get('/google/callback?code=google-code&state=attacker-state')
      .set('Cookie', 'oauth_state=expected-state')
      .expect(401);

    expect(authService.handleGoogleCallback).not.toHaveBeenCalled();
  });

  it('callback state 검증에 성공하면 쿠키를 폐기하고 인증 코드를 처리한다', async () => {
    const authService = createMockAuthService();
    authService.handleGoogleCallback.mockResolvedValue({
      type: 'pendingSignup',
      signupToken: 'signup-token',
    });

    const response = await request(createTestApp(authService))
      .get('/google/callback?code=google-code&state=expected-state')
      .set('Cookie', 'oauth_state=expected-state')
      .expect(200);

    expect(authService.handleGoogleCallback).toHaveBeenCalledWith('google-code');
    expect(response.headers['set-cookie']?.[0]).toContain('oauth_state=;');
  });
});

describe('AuthController refresh cookie', () => {
  it('갱신된 Access Token과 안전한 회원 정보를 함께 반환한다', async () => {
    const authService = createMockAuthService();
    authService.refreshToken.mockResolvedValue({
      tokenPair: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
      user: {
        id: 1,
        user_uuid: 'user-uuid',
        email: 'member@example.com',
        oauth_provider: 'google',
        oauth_id: 'google-id',
        nickname: '신준하',
        profile_image_url: 'profile.webp',
        isTermsAgreed: true,
        created_at: new Date('2026-09-18T00:00:00.000Z'),
      },
    });

    const response = await request(createTestApp(authService))
      .post('/refresh')
      .set('Cookie', 'jwt=valid-token')
      .expect(200);

    expect(response.body).toMatchObject({
      message: '토큰 갱신 성공',
      accessToken: 'new-access-token',
      user: {
        user_uuid: 'user-uuid',
        email: 'member@example.com',
        nickname: '신준하',
      },
    });
    expect(response.body.user).not.toHaveProperty('id');
    expect(response.body.user).not.toHaveProperty('oauth_id');
    expect(response.headers['set-cookie']?.[0]).toContain('jwt=new-refresh-token');
  });

  it('Redis 장애로 갱신이 503이면 기존 Refresh Token 쿠키를 지우지 않는다', async () => {
    const authService = createMockAuthService();
    authService.refreshToken.mockRejectedValue(Errors.ServiceUnavailable());

    const response = await request(createTestApp(authService))
      .post('/refresh')
      .set('Cookie', 'jwt=still-valid-token')
      .expect(503);

    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('토큰 만료처럼 인증 무효가 확인된 401이면 Refresh Token 쿠키를 지운다', async () => {
    const authService = createMockAuthService();
    authService.refreshToken.mockRejectedValue(Errors.Unauthorized('만료된 토큰'));

    const response = await request(createTestApp(authService))
      .post('/refresh')
      .set('Cookie', 'jwt=expired-token')
      .expect(401);

    expect(response.headers['set-cookie']?.[0]).toContain('jwt=;');
  });
});
