/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import http from 'k6/http';

import { BASE_URL, createCalendar, deleteCalendar } from './common.js';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  return createCalendar('Case 1: Write Load Test', 'Host1', 5);
}

export default function (data) {
  if (!data.slug) return;
  const uniqueNickname = `User_${__VU}_${__ITER}`;

  // 1. 참가자 등록 (비밀번호 4자리 이상 pass)
  const joinRes = http.post(
    `${BASE_URL}/calendars/${data.slug}/participants`,
    JSON.stringify({ nickname: uniqueNickname, password: 'pass' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(joinRes, { '참가 성공': (r) => r.status === 201 });
  const participantToken = joinRes.json('participantToken');

  if (!participantToken) {
    return;
  }

  sleep(Math.random() * 2);

  // 2. 투표 진행 (동적으로 생성된 시작일에 투표)
  const voteRes = http.post(
    `${BASE_URL}/calendars/${data.slug}/votes`,
    JSON.stringify({
      selectedDates: [data.start_date],
      voteType: 'available',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${participantToken}`,
      },
    }
  );
  check(voteRes, { '투표 성공': (r) => r.status === 200 });
}

export function teardown(data) {
  deleteCalendar(data.slug, data.hostToken);
}
