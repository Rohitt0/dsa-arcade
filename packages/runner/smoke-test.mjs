// Run inside the runner image: requires Linux, g++, and root to drop privileges.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';

const token = randomBytes(32).toString('hex');
const child = spawn(process.execPath, ['/app/server.mjs'], {
  env: { ...process.env, RUNNER_PORT: '14010', RUNNER_TOKEN: token },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = once(child, 'exit');
let logs = '';
child.stdout.on('data', (data) => { logs += data; });
child.stderr.on('data', (data) => { logs += data; });
const base = 'http://127.0.0.1:14010';
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (child.exitCode !== null) throw new Error(logs);
    try {
      const response = await fetch(`${base}/health`);
      ready = response.ok && (await response.json()).status === 'ok';
      if (ready) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Runner did not become ready: ${logs}`);
  console.log('PASS: runner starts with compiler dependencies');

  const testCases = [
    { input: '8 3\n4 2 7 1 6 3 8 5', expected: '17' },
    { input: '6 3\n2 1 5 1 3 2', expected: '9' },
    { input: '5 2\n1 2 3 4 5', expected: '9' },
    { input: '1 1\n42', expected: '42' },
    { input: '4 4\n3 6 2 9', expected: '20' },
    { input: '5 2\n-8 -3 -6 -2 -5', expected: '-7' },
  ];
  async function execute(sourceCode, suppliedToken = token) {
    const response = await fetch(`${base}/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-runner-token': suppliedToken },
      body: JSON.stringify({ sourceCode, testCases }),
    });
    return { httpStatus: response.status, ...await response.json() };
  }
  const source = `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
  long long maxCrystalEnergy(vector<int>& a, int k) {
    long long sum = accumulate(a.begin(), a.begin() + k, 0LL), best = sum;
    for (int i = k; i < (int)a.size(); ++i) {
      sum += (long long)a[i] - a[i-k]; best = max(best, sum);
    }
    return best;
  }
};
int main() {
  int n, k; cin >> n >> k; vector<int> a(n);
  for (int& v : a) cin >> v;
  cout << Solution().maxCrystalEnergy(a, k);
}`;
  const accepted = await execute(source);
  assert.equal(accepted.httpStatus, 200);
  assert.equal(accepted.status, 'ACCEPTED', JSON.stringify(accepted));
  assert.equal(accepted.results.filter((result) => result.passed).length, 6);
  console.log('PASS: C++ compiles and passes 6/6 cases via HTTP');
  const invalid = await execute('int main() { invalid c++ syntax }');
  assert.equal(invalid.status, 'COMPILE_ERROR', JSON.stringify(invalid));
  assert.doesNotMatch(invalid.message, /failed to execute|No such file or directory/);
  console.log('PASS: invalid C++ returns a real compiler diagnostic');
  const wrong = await execute('#include <iostream>\nint main() { std::cout << 0; }');
  assert.equal(wrong.status, 'WRONG_ANSWER', JSON.stringify(wrong));
  console.log('PASS: incorrect solution returns WRONG_ANSWER');
  assert.equal((await execute(source, 'invalid-token')).httpStatus, 401);
  console.log('PASS: unauthorized execution rejected');
} finally {
  if (child.exitCode === null) child.kill('SIGTERM');
  await exited;
}
