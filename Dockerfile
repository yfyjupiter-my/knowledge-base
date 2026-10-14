# syntax=docker/dockerfile:1

# ---------- 1. 安装依赖 ----------
FROM node:22-alpine AS deps
# 部分原生依赖在 musl 上需要 glibc 兼容层
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- 2. 构建 ----------
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# 设为 1 时开放 /admin 新建文章（顶栏按钮在构建时决定是否显示）
ARG KB_AUTHORING
ENV KB_AUTHORING=$KB_AUTHORING
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. 运行（仅包含 standalone 产物） ----------
FROM node:22-alpine AS runner
WORKDIR /app
ARG KB_AUTHORING

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    KB_AUTHORING=$KB_AUTHORING

# 使用非 root 用户运行
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
# standalone 包含 server.js 与最小化的 node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Markdown 文章：运行时读取，可通过 volume 挂载覆盖
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
