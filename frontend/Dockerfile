FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_ASSET_BASE_URL=https://pub-52f1db68b62c420aa3b098926983d749.r2.dev
ENV VITE_API_URL=/api/v1 \
    VITE_SOCKET_URL=/ \
    VITE_ASSET_BASE_URL=${VITE_ASSET_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

ENV BACKEND_UPSTREAM=backend:3000 \
    DOMAIN=localhost \
    NGINX_ENVSUBST_FILTER=^(DOMAIN|BACKEND_UPSTREAM)$

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
