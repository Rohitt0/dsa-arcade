import { spawnSync } from 'node:child_process';
import { chmod, chown, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const WORKER_UID = 65534;
const WORKER_GID = 65534;
const MAX_CODE_LENGTH = 30_000;
const MAX_TESTS = 20;
const MAX_INPUT_LENGTH = 220_000;
const MAX_OUTPUT_LENGTH = 16_384;
const MINIMAL_ENV = { PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', HOME: '/tmp' };

function runLimited(command, args, { input, timeout, maxBuffer, cwd }) {
  return spawnSync(command, args, {
    input,
    encoding: 'utf8',
    timeout,
    maxBuffer,
    cwd,
    uid: WORKER_UID,
    gid: WORKER_GID,
    env: MINIMAL_ENV,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function failureStatus(result) {
  if (result.error?.code === 'ETIMEDOUT') return 'TIME_LIMIT';
  if (result.error?.code === 'ENOBUFS') return 'OUTPUT_LIMIT';
  return null;
}

export async function executeCpp({ sourceCode, testCases }) {
  if (
    typeof sourceCode !== 'string' ||
    sourceCode.length > MAX_CODE_LENGTH ||
    !Array.isArray(testCases) ||
    testCases.length < 1 ||
    testCases.length > MAX_TESTS ||
    testCases.some(
      (test) =>
        typeof test.input !== 'string' ||
        test.input.length > MAX_INPUT_LENGTH ||
        typeof test.expected !== 'string' ||
        test.expected.length > MAX_OUTPUT_LENGTH,
    )
  ) {
    return { status: 'RUNNER_ERROR', message: 'The execution request was invalid.' };
  }

  const workDir = await mkdtemp(join(tmpdir(), 'dsa-run-'));
  try {
    await chmod(workDir, 0o770);
    await chown(workDir, WORKER_UID, 0);
    const compilation = runLimited(
      '/usr/bin/prlimit',
      [
        '--cpu=20:20',
        '--as=536870912',
        '--fsize=16777216',
        '--nproc=32',
        '--core=0',
        '--',
        '/usr/bin/g++',
        '-std=c++20',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-o',
        join(workDir, 'solution'),
        '-x',
        'c++',
        '-',
      ],
      {
        input: sourceCode,
        timeout: 25_000,
        maxBuffer: 32_000,
        cwd: workDir,
      },
    );
    const compileTimeout = failureStatus(compilation);
    if (compileTimeout) {
      return {
        status: compileTimeout,
        message:
          compileTimeout === 'TIME_LIMIT'
            ? 'Compilation took too long.'
            : 'Compiler output was too large.',
      };
    }
    if (compilation.error || compilation.status !== 0) {
      if (compilation.error || compilation.status === 126 || compilation.status === 127) {
        return {
          status: 'RUNNER_ERROR',
          message: 'The C++ compiler could not start. The runner deployment needs repair.',
        };
      }
      return {
        status: 'COMPILE_ERROR',
        message: (
          compilation.stderr ||
          compilation.error?.message ||
          'The C++ code did not compile.'
        ).slice(0, 8_000),
      };
    }

    const results = [];
    for (const test of testCases) {
      const run = runLimited(
        '/usr/bin/prlimit',
        [
          '--cpu=2:2',
          '--as=134217728',
          '--fsize=16777216',
          '--nproc=32',
          '--core=0',
          '--',
          '/usr/bin/timeout',
          '--signal=KILL',
          '2s',
          join(workDir, 'solution'),
        ],
        {
          input: test.input,
          timeout: 4_000,
          maxBuffer: MAX_OUTPUT_LENGTH,
          cwd: workDir,
        },
      );
      const runLimit = failureStatus(run);
      if (runLimit) {
        return {
          status: runLimit === 'OUTPUT_LIMIT' ? 'RUNTIME_ERROR' : 'TIME_LIMIT',
          results,
          message: runLimit === 'OUTPUT_LIMIT' ? 'Program output exceeded the limit.' : undefined,
        };
      }
      if (run.error || run.status !== 0) {
        return {
          status:
            run.status === 137 || run.status === 124 || run.signal === 'SIGKILL'
              ? 'TIME_LIMIT'
              : 'RUNTIME_ERROR',
          results,
          message: (
            run.stderr ||
            `The program stopped unexpectedly (exit ${run.status ?? 'none'}${run.signal ? `, ${run.signal}` : ''}).`
          ).slice(0, 4_000),
        };
      }
      const actual = (run.stdout ?? '').trim();
      const passed = actual === test.expected.trim();
      results.push({ passed, actual: actual.slice(0, MAX_OUTPUT_LENGTH) });
      if (!passed) return { status: 'WRONG_ANSWER', results };
    }
    return { status: 'ACCEPTED', results };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
