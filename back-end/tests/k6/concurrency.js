/* global __VU */
import { check } from 'k6';
import http from 'k6/http';

import { BASE_URL, createCalendar, deleteCalendar } from './common.js';

export const options = {
  scenarios: {
    exact_concurrency: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const calData = createCalendar('Case 3: Concurrency Test', 'Host3', 2);
  const tokens = [];

  // 사전에 20명 유저 참가시켜 토큰 발급
  for (let i = 1; i <= 20; i++) {
    const joinRes = http.post(
      `${BASE_URL}/calendars/${calData.slug}/participants`,
      JSON.stringify({ nickname: `ConcUser_${i}`, password: 'pass' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(joinRes, { 'setup 참가자 생성 성공 (201)': (r) => r.status === 201 });
    tokens.push(joinRes.json('participantToken'));
  }

  return { ...calData, tokens };
}

export default function (data) {
  const myToken = data.tokens[__VU - 1];

  if (!myToken) {
    return;
  }

  const voteRes = http.post(
    `${BASE_URL}/calendars/${data.slug}/votes`,
    JSON.stringify({
      selectedDates: [data.start_date],
      voteType: 'available',
    }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${myToken}` } }
  );

  check(voteRes, { '동시 투표 성공 (200)': (r) => r.status === 200 });
}

export function teardown(data) {
  deleteCalendar(data.slug, data.hostToken);
}
