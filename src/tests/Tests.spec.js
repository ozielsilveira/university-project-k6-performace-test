import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getPetsDuration = new Trend('get_pets_duration', true);
export const rateContentOK = new Rate('status_ok_rate');

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '30s', target: 30 },    
    { duration: '1m', target: 100 },
    { duration: '135s', target: 300 },
  ],
  thresholds: {
    get_pets_duration: ['p(95)<5700'],
    status_ok_rate: ['rate>0.88'],
    http_req_failed: ['rate<0.12'],
  }
};

export function handleSummary(data) {
  return {
    './output/petstore_report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl =
    'https://petstore.swagger.io/v2/pet/findByStatus?status=available';
  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(baseUrl, params);

  getPetsDuration.add(res.timings.duration);
  rateContentOK.add(res.status === OK);

  check(res, {
    'GET Pets - Status 200': () => res.status === OK,
    'GET Pets - Tempo de resposta razoável': () => res.timings.duration < 5700
  });
}
