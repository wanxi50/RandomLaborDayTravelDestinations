# 第一阶段：构建前端
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 第二阶段：生产运行
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY src/data/text-config.json ./src/data/text-config.json
COPY --from=builder /app/dist ./dist/

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]
