# 1단계: 빌드 환경
FROM node:20-alpine AS builder
ENV TZ=UTC
WORKDIR /usr/src/app
COPY package*.json ./
# npm을 사용하여 의존성 설치
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 프로덕션 환경
FROM node:20-alpine
ENV TZ=UTC \
    NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=192
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
RUN mkdir -p logs && chown -R node:node /usr/src/app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/v1/health/live').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD [ "node", "dist/web.js" ]
