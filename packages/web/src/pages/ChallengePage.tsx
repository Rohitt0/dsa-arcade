import { lazy, Suspense, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import type { SubmissionStatus } from '@dsa/shared';
import { useChallenge, useSubmitCode } from '../features/challenge/useChallenge';
import { ErrorState, LoadingState } from '../components/feedback';
import { PixelBadge, PixelButton, PixelPanel } from '../components/ui';

const Editor = lazy(() => import('../editor/MonacoEditor'));

const statusLabel: Record<SubmissionStatus, string> = {
  ACCEPTED: 'All tests passed',
  WRONG_ANSWER: 'Some tests need another look',
  COMPILE_ERROR: 'C++ compile error',
  RUNTIME_ERROR: 'The program stopped unexpectedly',
  TIME_LIMIT: 'Time limit exceeded',
  RUNNER_ERROR: 'Runner error',
};

export function ChallengePage() {
  const { slug = '' } = useParams();
  const { data: challenge, isLoading, isError, error, refetch } = useChallenge(slug);
  const submit = useSubmitCode(slug);
  const [editedCode, setEditedCode] = useState<string>();
  const code = editedCode ?? challenge?.starterCode ?? '';

  if (isLoading) return <LoadingState label="Opening the challenge…" />;
  if (isError || !challenge) {
    const status = error instanceof AxiosError ? error.response?.status : undefined;
    return status === 404 ? (
      <ErrorState title="Challenge not found" message="This quest is not in the archives." />
    ) : (
      <ErrorState onRetry={() => void refetch()} />
    );
  }

  const result = submit.data;

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <Link
        to={`/pattern/sliding-window`}
        className="mb-4 inline-block min-h-11 py-3 font-pixel text-[9px] uppercase tracking-wide text-sky hover:underline"
      >
        ← Back to Sliding Window
      </Link>

      <header className="mb-5">
        <p className="mb-2 font-pixel text-[9px] uppercase tracking-widest text-sun">C++ Quest</p>
        <h1 className="text-lg leading-relaxed text-gold sm:text-xl">{challenge.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <PixelBadge tone="easy">EASY</PixelBadge>
          <PixelBadge tone="default">Sliding Window</PixelBadge>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <PixelPanel title="The quest" accent="#6cb8e4">
            <p className="text-sm leading-relaxed text-parchment">{challenge.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="min-w-0">
                <h2 className="mb-1 font-pixel text-[9px] text-sun">Input</h2>
                <p className="break-words text-xs leading-relaxed text-stone-300">
                  {challenge.inputFormat}
                </p>
              </div>
              <div className="min-w-0">
                <h2 className="mb-1 font-pixel text-[9px] text-sun">Output</h2>
                <p className="break-words text-xs leading-relaxed text-stone-300">
                  {challenge.outputFormat}
                </p>
              </div>
            </div>
            <p className="mt-4 break-words border-l-2 border-sun pl-3 text-xs leading-relaxed text-stone-300">
              <strong className="text-parchment">Constraints: </strong>
              {challenge.constraints}
            </p>
          </PixelPanel>

          <PixelPanel title="Example tests" accent="#b06cf0">
            <div className="space-y-3">
              {challenge.sampleTests.map((test) => (
                <div
                  key={test.caseNumber}
                  className="grid min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-2"
                >
                  <div className="min-w-0">
                    <span className="font-pixel text-[8px] text-stone-400">INPUT</span>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all bg-night-900 p-2 text-parchment">
                      {test.input || '(empty line)'}
                    </pre>
                  </div>
                  <div className="min-w-0">
                    <span className="font-pixel text-[8px] text-stone-400">EXPECTED</span>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all bg-night-900 p-2 text-parchment">
                      {test.expected}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </PixelPanel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <PixelPanel title="Your C++ solution" accent="#ffcf4e">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded border border-night-600 bg-night-900 px-3 py-2 font-mono text-sm text-grass">
                C++20
              </span>
              <PixelButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditedCode(challenge.starterCode)}
              >
                Reset starter code
              </PixelButton>
            </div>
            <div className="min-h-[320px] overflow-hidden border-2 border-ink bg-night-900 sm:min-h-[380px]">
              <Suspense
                fallback={
                  <div className="flex h-[45dvh] min-h-[320px] items-center justify-center text-sm text-stone-300">
                    Loading editor…
                  </div>
                }
              >
                <Editor
                  height="min(55dvh, 560px)"
                  language="cpp"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setEditedCode(value ?? '')}
                  options={{
                    automaticLayout: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    tabSize: 4,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    lineNumbersMinChars: 3,
                    overviewRulerLanes: 0,
                  }}
                />
              </Suspense>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-400">
              Your code runs in a restricted C++ sandbox. It cannot access the network or the app
              server.
            </p>
            <PixelButton
              type="button"
              fullWidth
              className="mt-4"
              loading={submit.isPending}
              disabled={!code.trim()}
              onClick={() => submit.mutate(code)}
            >
              {submit.isPending ? 'Running tests…' : 'Run C++ tests'}
            </PixelButton>
          </PixelPanel>

          {submit.isError && (
            <PixelPanel title="Could not run yet" accent="#e4572e">
              <p role="alert" className="text-sm leading-relaxed text-parchment">
                {submit.error instanceof AxiosError
                  ? (submit.error.response?.data?.error?.message ??
                    'The runner could not be reached.')
                  : 'The runner could not be reached. Start the isolated runner and retry.'}
              </p>
            </PixelPanel>
          )}

          {result && (
            <PixelPanel
              title="Test results"
              accent={result.status === 'ACCEPTED' ? '#5fc26a' : '#e4572e'}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p aria-live="polite" className="text-sm font-semibold text-parchment">
                  {statusLabel[result.status]}
                </p>
                <PixelBadge tone={result.status === 'ACCEPTED' ? 'easy' : 'hard'}>
                  {result.passed}/{result.total} passed
                </PixelBadge>
              </div>
              {result.message && (
                <pre className="mb-3 max-h-48 overflow-auto whitespace-pre-wrap break-words border border-ember/50 bg-night-900 p-3 font-mono text-xs leading-relaxed text-ember">
                  {result.message}
                </pre>
              )}
              <div className="space-y-2">
                {result.tests.map((test) => (
                  <div
                    key={test.caseNumber}
                    className="border border-night-600 bg-night-900 p-3 text-xs"
                  >
                    <p className={test.passed ? 'text-grass' : 'text-ember'}>
                      Test {test.caseNumber} {test.passed ? 'passed' : 'failed'}
                      {test.hidden ? ' · hidden case' : ''}
                    </p>
                    {!test.hidden && !test.passed && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <p className="break-all text-stone-300">Expected: {test.expected}</p>
                        <p className="break-all text-stone-300">Received: {test.actual}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PixelPanel>
          )}
        </div>
      </div>
    </main>
  );
}
