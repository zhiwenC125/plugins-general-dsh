FROM node:24-bookworm-slim
WORKDIR /app
COPY services/revolution-relay/package.json services/revolution-relay/package-lock.json services/revolution-relay/
RUN npm --prefix services/revolution-relay ci --omit=dev
COPY services/revolution-relay/ services/revolution-relay/
COPY integrations/bot/feishu-transport.mjs integrations/bot/feishu-transport.mjs
COPY plugins/revolution-knowledge/src/feishu-login.mjs plugins/revolution-knowledge/src/feishu-login.mjs
COPY plugins/revolution-knowledge/engine/core.mjs plugins/revolution-knowledge/engine/core.mjs
COPY plugins/revolution-knowledge/engine/feishu.mjs plugins/revolution-knowledge/engine/feishu.mjs
RUN mkdir -p /home/node/.revolution-relay && chown -R node:node /home/node/.revolution-relay
USER node
ENV RELAY_DATA_DIR=/home/node/.revolution-relay/feishu
EXPOSE 8787
CMD ["node", "services/revolution-relay/server.mjs"]
