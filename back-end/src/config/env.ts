import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(process.cwd(), '.env.test') });
} else {
  dotenv.config();
}

// 로컬 실행과 Docker 실행 모두 동일한 UTC 시간대를 사용한다.
process.env.TZ = 'UTC';

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MAIN_JWT_SECRET: string;
  PARTICIPANT_JWT_SECRET: string;
  REFRESH_JWT_SECRET: string;
  LEGACY_JWT_SECRET?: string;
  SESSION_SECRET: string;
  REDIS_URL: string;
  DB_HOST: string;
  DB_USER: string;
  DB_USER_PASSWORD: string;
  DB_NAME: string;
  CLIENT_URL: string;
  GET_REST_DE_INFO: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BACKEND_URL: string;
  SIGNUP_MODE: 'pending' | 'immediate';
  DB_CONNECTION_LIMIT: number;
  ENABLE_RATE_LIMIT: boolean;
  GENERAL_RATE_LIMIT_MAX: number;
  HOST_ACCESS_TOKEN?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL: string;
}

function parsePositiveIntegerEnv(key: string, fallback: number): number {
  const rawValue = process.env[key];
  const value = rawValue === undefined || rawValue === '' ? fallback : Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key}는 1 이상의 정수여야 합니다. 현재 값: ${rawValue}`);
  }

  return value;
}

function parseBooleanEnv(key: string): boolean {
  const value = process.env[key];

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${key}는 true 또는 false여야 합니다. 현재 값: ${value}`);
}

function parseSignupMode(): EnvConfig['SIGNUP_MODE'] {
  const value = process.env.SIGNUP_MODE;

  if (value === 'pending' || value === 'immediate') {
    return value;
  }

  throw new Error(`SIGNUP_MODE는 pending 또는 immediate여야 합니다. 현재 값: ${value}`);
}

function validateEnv(): EnvConfig {
  const required = [
    'MAIN_JWT_SECRET',
    'PARTICIPANT_JWT_SECRET',
    'REFRESH_JWT_SECRET',
    'SESSION_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_USER_PASSWORD',
    'DB_NAME',
    'REDIS_URL',
    'CLIENT_URL',
    'GET_REST_DE_INFO',
    'PORT',
    'NODE_ENV',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'BACKEND_URL',
    'SIGNUP_MODE',
    'DB_CONNECTION_LIMIT',
    'ENABLE_RATE_LIMIT',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `필수 환경변수를 찾지 못했습니다: ${missing.join(', ')}\n` +
        `env파일을 다시 한 번 확인해주세요.`
    );
  }

  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT);
  const signupMode = parseSignupMode();
  const enableRateLimit = parseBooleanEnv('ENABLE_RATE_LIMIT');
  const generalRateLimitMax = parsePositiveIntegerEnv('GENERAL_RATE_LIMIT_MAX', 600);

  if (!Number.isInteger(connectionLimit) || connectionLimit <= 0) {
    throw new Error(
      `DB_CONNECTION_LIMIT는 1 이상의 정수여야 합니다. 현재 값: ${process.env.DB_CONNECTION_LIMIT}`
    );
  }

  return {
    PORT: parseInt(process.env.PORT!, 10),
    NODE_ENV: process.env.NODE_ENV!,
    MAIN_JWT_SECRET: process.env.MAIN_JWT_SECRET!,
    PARTICIPANT_JWT_SECRET: process.env.PARTICIPANT_JWT_SECRET!,
    REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET!,
    LEGACY_JWT_SECRET: process.env.LEGACY_JWT_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    REDIS_URL: process.env.REDIS_URL!,
    DB_HOST: process.env.DB_HOST!,
    DB_USER: process.env.DB_USER!,
    DB_USER_PASSWORD: process.env.DB_USER_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
    CLIENT_URL: process.env.CLIENT_URL!,
    GET_REST_DE_INFO: process.env.GET_REST_DE_INFO!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',
    SIGNUP_MODE: signupMode,
    DB_CONNECTION_LIMIT: connectionLimit,
    ENABLE_RATE_LIMIT: enableRateLimit,
    GENERAL_RATE_LIMIT_MAX: generalRateLimitMax,
    HOST_ACCESS_TOKEN: process.env.HOST_ACCESS_TOKEN,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  };
}

export const env = validateEnv();
