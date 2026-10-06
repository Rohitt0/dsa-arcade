FROM node:22-alpine
WORKDIR /app
COPY gateway.mjs ./
USER node
EXPOSE 4010
ENTRYPOINT ["node", "/app/gateway.mjs"]
