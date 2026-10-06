FROM dsa-cpp-sandbox:dev

USER root
WORKDIR /app
COPY server.mjs sandbox.mjs ./
EXPOSE 4010
ENTRYPOINT ["node", "/app/server.mjs"]
