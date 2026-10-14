# Railway C++ runner

The runner requires the Linux compiler and resource-limit tools installed by
`Dockerfile`. A generic Node/Railpack deployment cannot execute C++ submissions.

For the **@dsa/runner** service only, configure:

- Root Directory: `/packages/runner`
- Railway Config File: `/packages/runner/railway.json`
- Remove custom build/start command overrides; the Dockerfile starts the server.
- Keep `RUNNER_PORT=4010` and the same `RUNNER_TOKEN` used by the API.

Commit and push the runner changes, then deploy the latest commit. Build logs must
show Dockerfile steps installing/checking `g++`. The API's `RUNNER_URL` remains
`http://dsarunner.railway.internal:4010`.

## Local HTTP smoke test (Docker required)

From the repository root in PowerShell:

```powershell
rtk docker build -t dsa-runner-deploy-check packages/runner
rtk docker run --rm --network none --read-only --tmpfs /tmp:rw,exec,size=64m --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID --pids-limit 64 --memory 256m --mount "type=bind,source=$PWD/packages/runner/smoke-test.mjs,target=/app/smoke-test.mjs,readonly" --entrypoint node dsa-runner-deploy-check /app/smoke-test.mjs
```

This exercises the real HTTP runner and compiler with six passing cases, invalid
C++, an incorrect answer, and an invalid token. It does not verify the live Railway
deployment.

Append `--crowded-nobody` to the smoke-test command to reproduce the old shared
UID process-limit failure, then verify the dedicated worker still passes all cases.
The Dockerfile and sandbox use dedicated UID/GID 21001. Compilation and execution
retain their process, CPU, memory, time, and output limits.
