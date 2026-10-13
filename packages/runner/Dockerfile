FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ util-linux coreutils \
    && /usr/bin/g++ --version \
    && /usr/bin/prlimit --version \
    && /usr/bin/timeout --version \
    && rm -rf /var/lib/apt/lists/*

USER root
WORKDIR /app
COPY server.mjs sandbox.mjs ./
EXPOSE 4010
ENTRYPOINT ["node", "/app/server.mjs"]
