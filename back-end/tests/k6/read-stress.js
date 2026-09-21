/* global __ENV */
import { check, sleep } from 'k6';
import http from 'k6/http';

import { BASE_URL, createCalendar, deleteCalendar } from './common.js';

export const options = {
  stages: [
    { duration: '5s', target: 100 },
    { duration: '15s', target: 300 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  return createCalendar('Case 2: Read Stress Test', 'Host2', 5);
}

export default function (data) {
  const res = http.get(`${BASE_URL}/calendars/${data.slug}/votes`);

  check(res, {
    '조회 성공 (200)': (r) => r.status === 200,
    '응답 시간 500ms 이하': (r) => r.timings.duration < 500,
  });

  sleep(0.5);
}

export function teardown(data) {
  deleteCalendar(data.slug, data.hostToken);
}
