FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ util-linux coreutils \
    && /usr/bin/g++ --version \
    && /usr/bin/prlimit --version \
    && /usr/bin/timeout --version \
    && rm -rf /var/lib/apt/lists/*

USER root
RUN groupadd --gid 21001 dsa-worker \
    && useradd --uid 21001 --gid 21001 --no-create-home --shell /usr/sbin/nologin dsa-worker
WORKDIR /app
COPY server.mjs sandbox.mjs ./
EXPOSE 4010
ENTRYPOINT ["node", "/app/server.mjs"]
