/* global __ENV */
import { check, fail } from 'k6';
import http from 'k6/http';

// 1. 공통 환경 변수 및 URL 설정
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
export const WS_URL = __ENV.WS_URL || 'ws://localhost:3000/socket.io/?EIO=4&transport=websocket';
export const HOST_TOKEN = __ENV.HOST_ACCESS_TOKEN;

function formatUtcDateOnly(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 2. 동적 날짜 생성기 (오늘 ~ X일 후)
export function getDates(daysToAdd = 5) {
  const today = new Date();
  const start_date = formatUtcDateOnly(today);

  const future = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const end_date = formatUtcDateOnly(future);

  return { start_date, end_date };
}

// 3. 캘린더 자동 생성 (setup 용)
export function createCalendar(title, hostNickname, durationDays = 5) {
  if (!HOST_TOKEN) {
    fail('HOST_ACCESS_TOKEN 환경 변수가 필요합니다');
  }

  const { start_date, end_date } = getDates(durationDays);

  const res = http.post(
    `${BASE_URL}/calendars`,
    JSON.stringify({
      title,
      start_date,
      end_date,
      hostNickname,
    }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HOST_TOKEN}` } }
  );

  const ok = check(res, {
    'setup 캘린더 생성 성공 (201)': (r) => r.status === 201,
    'setup participantToken 존재': (r) => Boolean(r.json('participantToken')),
    'setup slug 존재': (r) => Boolean(r.json('calendar.slug')),
  });

  if (!ok) {
    fail(`캘린더 생성 실패: status=${res.status}, body=${res.body}`);
  }

  return {
    slug: res.json('calendar.slug'),
    hostToken: res.json('participantToken'),
    start_date, // 투표할 때 사용할 수 있도록 반환
  };
}

// 4. 캘린더 삭제 (teardown 용)
export function deleteCalendar(slug, hostToken) {
  if (!slug || !hostToken) return;
  const res = http.del(`${BASE_URL}/calendars/${slug}`, null, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });

  check(res, {
    'teardown 캘린더 삭제 성공': (r) => r.status === 200 || r.status === 404,
  });
}
