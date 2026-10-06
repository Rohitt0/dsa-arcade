import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const port = Number(process.env.GATEWAY_PORT ?? 4010);
const token = process.env.RUNNER_TOKEN ?? '';
const runnerUrl = process.env.RUNNER_URL ?? 'http://runner:4010';
const maxRequestBytes = 256_000;

function reply(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function hasValidToken(value) {
  if (!token || typeof value !== 'string') return false;
  const provided = Buffer.from(value);
  const expected = Buffer.from(token);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString('utf8');
    if (Buffer.byteLength(raw) > maxRequestBytes) throw new Error('Request too large');
  }
  return JSON.parse(raw);
}

async function proxy(req, res, path, payload) {
  try {
    const response = await fetch(`${runnerUrl}${path}`, {
      method: req.method,
      headers:
        path === '/execute' ? { 'content-type': 'application/json', 'x-runner-token': token } : {},
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(path === '/execute' ? 55_000 : 3_000),
    });
    const data = await response.json();
    reply(res, response.status, data);
  } catch {
    reply(res, 503, { error: 'C++ runner unavailable' });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    await proxy(req, res, '/health');
    return;
  }
  if (req.method !== 'POST' || req.url !== '/execute') {
    reply(res, 404, { error: 'Not found' });
    return;
  }
  if (!hasValidToken(req.headers['x-runner-token'])) {
    reply(res, 401, { error: 'Unauthorized' });
    return;
  }
  try {
    const payload = await readJson(req);
    await proxy(req, res, '/execute', payload);
  } catch {
    reply(res, 400, { error: 'Invalid execution request' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Restricted runner gateway listening on ${port}`);
});
