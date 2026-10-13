import { timingSafeEqual } from 'node:crypto';
import { accessSync, constants } from 'node:fs';
import { createServer } from 'node:http';
import { executeCpp } from './sandbox.mjs';

// A generic Node deployment can start HTTP successfully but cannot judge C++.
for (const executable of ['/usr/bin/g++', '/usr/bin/prlimit', '/usr/bin/timeout']) {
  try {
    accessSync(executable, constants.X_OK);
  } catch {
    console.error(`Runner dependency missing: ${executable}. Deploy packages/runner/Dockerfile.`);
    process.exit(1);
  }
}

const port = Number(process.env.RUNNER_PORT ?? 4010);
const token = process.env.RUNNER_TOKEN ?? '';
const maxRequestBytes = 256_000;
const maxConcurrentRuns = 1;
let activeRuns = 0;

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

function validPayload(payload) {
  return (
    typeof payload?.sourceCode === 'string' &&
    payload.sourceCode.length <= 30_000 &&
    Array.isArray(payload.testCases) &&
    payload.testCases.length >= 1 &&
    payload.testCases.length <= 20 &&
    payload.testCases.every(
      (test) =>
        typeof test.input === 'string' &&
        test.input.length <= 220_000 &&
        typeof test.expected === 'string' &&
        test.expected.length <= 16_384,
    )
  );
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    reply(res, 200, { status: 'ok' });
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
  if (activeRuns >= maxConcurrentRuns) {
    reply(res, 429, { error: 'Runner is busy. Retry shortly.' });
    return;
  }

  activeRuns += 1;
  try {
    const payload = await readJson(req);
    if (!validPayload(payload)) {
      reply(res, 400, { error: 'Invalid execution request' });
      return;
    }
    reply(res, 200, await executeCpp(payload));
  } catch (error) {
    console.error('C++ execution service error:', error);
    reply(res, 503, { error: 'C++ sandbox unavailable' });
  } finally {
    activeRuns -= 1;
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Isolated C++ runner listening on ${port}`);
});
